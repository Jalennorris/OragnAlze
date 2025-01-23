package com.jalennorris.server.service;

import com.jalennorris.server.Models.UserModels;
import com.jalennorris.server.Models.loginModels;
import com.jalennorris.server.Repository.UserRepository;
import com.jalennorris.server.enums.Role;
import com.jalennorris.server.dto.UserDTO;
import com.jalennorris.server.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Logger;

@Service
public class UserService {

    private static final Logger LOGGER = Logger.getLogger(UserService.class.getName());

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    // Helper method to convert UserModels to UserDTO
    private UserDTO convertToDto(UserModels userModel, String token) {
        return new UserDTO(
                userModel.getUserId(),
                userModel.getFirstname(),
                userModel.getLastname(),
                userModel.getEmail(),
                userModel.getUsername(),
                userModel.getRole(),
                token
        );
    }

    // Register a new user (Save user and generate token)
    @Async
    @CacheEvict(value = "users", allEntries = true)
    public CompletableFuture<UserDTO> createUser(UserModels user) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Check if the email already exists
                if (userRepository.findByEmail(user.getEmail()).isPresent()) {
                    throw new RuntimeException("Error creating user: Email already exists");
                }

                // Encode the password
                String encodedPassword = passwordEncoder.encode(user.getPassword());
                user.setPassword(encodedPassword);

                // Save the user
                UserModels savedUser = userRepository.save(user);

                // Generate a token
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

                // Convert to DTO with token
                return convertToDto(savedUser, token);
            } catch (Exception e) {
                LOGGER.severe("Error creating user: " + e.getMessage());
                throw new RuntimeException("Error creating user: " + e.getMessage(), e);
            }
        });
    }

    // Get all users (Admin access only)
    @Async
    @Cacheable(value = "users", unless = "#result == null || #result.isEmpty()")
    public CompletableFuture<List<UserDTO>> getAllUsers(String token) {
        return CompletableFuture.supplyAsync(() -> {
            String username = jwtUtil.extractUsername(token);
            Role role = jwtUtil.extractRole(token);

            if (!jwtUtil.validateToken(token, username, role)) {
                throw new RuntimeException("Invalid token");
            }

            if (!isAdmin(username)) {
                throw new RuntimeException("Unauthorized access. Admins only.");
            }

            List<UserModels> users = userRepository.findAll();
            return users.stream()
                    .map(user -> convertToDto(user, null))
                    .toList();
        });
    }

    // Get user by id (Admin or user with token)
    @Async
    @Cacheable(value = "users", key = "#id", unless = "#result == null")
    public CompletableFuture<UserDTO> getUserById(Long id, String token) {
        return CompletableFuture.supplyAsync(() -> {
            String username = jwtUtil.extractUsername(token);
            Role role = jwtUtil.extractRole(token);

            if (!jwtUtil.validateToken(token, username, role)) {
                throw new RuntimeException("Invalid token");
            }

            UserModels user = userRepository.findById(id).orElse(null);

            if (user == null || (!isAdmin(username) && !username.equals(user.getUsername()))) {
                throw new RuntimeException("Unauthorized access.");
            }

            return convertToDto(user, token);
        });
    }

    // Update user details
    @Async
    @CacheEvict(value = "users", key = "#id")
    public CompletableFuture<UserDTO> updateUser(Long id, UserModels user, String token) {
        return CompletableFuture.supplyAsync(() -> {
            String usernameFromToken = jwtUtil.extractUsername(token);
            Role role = jwtUtil.extractRole(token);

            if (!jwtUtil.validateToken(token, usernameFromToken, role)) {
                throw new RuntimeException("Invalid token");
            }

            if (!user.getUsername().equals(usernameFromToken) && !isAdmin(usernameFromToken)) {
                throw new RuntimeException("Unauthorized to update this user.");
            }

            UserModels existingUser = userRepository.findById(id).orElse(null);
            if (existingUser != null) {
                existingUser.setFirstname(user.getFirstname());
                existingUser.setLastname(user.getLastname());
                existingUser.setEmail(user.getEmail());
                existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
                UserModels updatedUser = userRepository.save(existingUser);
                return convertToDto(updatedUser, token);
            }
            return null;
        });
    }

    // Delete user by ID (Admin or user with token)
    @Async
    @CacheEvict(value = "users", key = "#id")
    public CompletableFuture<Boolean> deleteUser(long id, String token) {
        return CompletableFuture.supplyAsync(() -> {
            String usernameFromToken = jwtUtil.extractUsername(token);
            Role role = jwtUtil.extractRole(token);

            if (!jwtUtil.validateToken(token, usernameFromToken, role)) {
                throw new RuntimeException("Invalid token");
            }

            UserModels user = userRepository.findById(id).orElse(null);
            if (user != null && (isAdmin(usernameFromToken) || usernameFromToken.equals(user.getUsername()))) {
                userRepository.deleteById(id);
                return true;
            } else {
                throw new RuntimeException("Unauthorized or User not found");
            }
        });
    }

    // Login: Authenticate and generate JWT token
    @Async
    @Cacheable(value = "users", key = "#loginRequest.username", unless = "#result == null")
    public CompletableFuture<String> login(loginModels loginRequest) {
        return CompletableFuture.supplyAsync(() -> {
            LOGGER.info("Login attempt for username: " + loginRequest.getUsername());
            UserModels user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
                LOGGER.info("Login successful for user: " + user.getUsername());
                return token;
            } else {
                LOGGER.warning("Login failed: Incorrect password for user " + loginRequest.getUsername());
                throw new RuntimeException("Incorrect username or password");
            }
        });
    }

    // Check if user is an admin (for access control)
    private boolean isAdmin(String username) {
        return userRepository.findByUsername(username)
                .map(user -> Role.ADMIN.equals(user.getRole()))
                .orElse(false);
    }

    // Method to validate JWT
    public boolean isValidJwt(String token) {
        try {
            String username = jwtUtil.extractUsername(token);
            Role role = jwtUtil.extractRole(token);
            return jwtUtil.validateToken(token, username, role);
        } catch (Exception e) {
            LOGGER.severe("Error validating JWT: " + e.getMessage());
            return false;
        }
    }

    // Method to get user info from token
    public CompletableFuture<UserDTO> getUserFromToken(String token) {
        return CompletableFuture.supplyAsync(() -> {
            String username = jwtUtil.extractUsername(token);
            UserModels user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return convertToDto(user, token);
        });
    }

    // Create user if not exist (Overloaded method)
    public CompletableFuture<UserDTO> createUserIfNotExist(UserModels user) {
        return CompletableFuture.supplyAsync(() -> {
            if (userRepository.findByUsername(user.getUsername()).isPresent()) {
                throw new RuntimeException("User with username " + user.getUsername() + " already exists.");
            }

            try {
                String encodedPassword = passwordEncoder.encode(user.getPassword());
                user.setPassword(encodedPassword);
                UserModels savedUser = userRepository.save(user);
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
                return convertToDto(savedUser, token);
            } catch (Exception e) {
                throw new RuntimeException("Error creating user: " + e.getMessage(), e);
            }
        });
    }

    // Create user if not exist (loginModels parameter)
    public boolean createUserIfNotExist(loginModels loginRequest) {
        Optional<UserModels> existingUser = userRepository.findByUsername(loginRequest.getUsername());
        if (existingUser.isPresent()) {
            return false;
        } else {
            UserModels newUser = new UserModels();
            newUser.setUsername(loginRequest.getUsername());
            newUser.setPassword(passwordEncoder.encode(loginRequest.getPassword()));
            newUser.setRole(Role.USER);
            userRepository.save(newUser);
            return true;
        }
    }
}