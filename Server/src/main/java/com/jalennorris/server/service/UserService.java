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
import java.util.logging.Level;
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
                LOGGER.log(Level.SEVERE, "Error creating user: {0}", e.getMessage());
                throw new RuntimeException("Error creating user: " + e.getMessage(), e);
            }
        });
    }

    // Get all users (Admin access only)
    @Async
    @Cacheable(value = "users", unless = "#result == null || #result.isEmpty()")
    public CompletableFuture<List<UserDTO>> getAllUsers(String token) {
        return CompletableFuture.supplyAsync(() -> {
            Optional<String> usernameOpt = jwtUtil.extractUsername(token);
            Optional<Role> roleOpt = jwtUtil.extractRole(token);

            if (usernameOpt.isPresent() && roleOpt.isPresent() && jwtUtil.validateToken(token, usernameOpt.get(), roleOpt.get())) {
                String username = usernameOpt.get();
                if (!isAdmin(username)) {
                    throw new RuntimeException("Unauthorized access. Admins only.");
                }

                List<UserModels> users = userRepository.findAll();
                return users.stream()
                        .map(user -> convertToDto(user, token))
                        .toList();
            } else {
                throw new RuntimeException("Invalid token");
            }
        });
    }

    // Get user by id (Admin or user with token)
    @Async
    @Cacheable(value = "users", key = "#id", unless = "#result == null")
    public CompletableFuture<UserDTO> getUserById(Long id, String token) {
        return CompletableFuture.supplyAsync(() -> {
            Optional<String> usernameOpt = jwtUtil.extractUsername(token);
            Optional<Role> roleOpt = jwtUtil.extractRole(token);

            if (usernameOpt.isPresent() && roleOpt.isPresent() && jwtUtil.validateToken(token, usernameOpt.get(), roleOpt.get())) {
                String username = usernameOpt.get();

                UserModels user = userRepository.findById(id).orElse(null);

                if (user == null || (!isAdmin(username) && !username.equals(user.getUsername()))) {
                    throw new RuntimeException("Unauthorized access.");
                }

                return convertToDto(user, null);
            } else {
                throw new RuntimeException("Invalid token");
            }
        });
    }

    // Update user details
    @Async
    @CacheEvict(value = "users", key = "#id")
    public CompletableFuture<UserDTO> updateUser(Long id, UserModels user, String token) {
        return CompletableFuture.supplyAsync(() -> {
            Optional<String> usernameOpt = jwtUtil.extractUsername(token);
            Optional<Role> roleOpt = jwtUtil.extractRole(token);

            if (usernameOpt.isPresent() && roleOpt.isPresent() && jwtUtil.validateToken(token, usernameOpt.get(), roleOpt.get())) {
                String usernameFromToken = usernameOpt.get();

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
            } else {
                throw new RuntimeException("Invalid token");
            }
        });
    }

    // Delete user by ID (Admin or user with token)
    @Async
    @CacheEvict(value = "users", key = "#id")
    public CompletableFuture<Boolean> deleteUser(long id, String token) {
        return CompletableFuture.supplyAsync(() -> {
            Optional<String> usernameOpt = jwtUtil.extractUsername(token);
            Optional<Role> roleOpt = jwtUtil.extractRole(token);

            if (usernameOpt.isPresent() && roleOpt.isPresent() && jwtUtil.validateToken(token, usernameOpt.get(), roleOpt.get())) {
                String usernameFromToken = usernameOpt.get();

                UserModels user = userRepository.findById(id).orElse(null);
                if (user != null && (isAdmin(usernameFromToken) || usernameFromToken.equals(user.getUsername()))) {
                    userRepository.deleteById(id);
                    return true;
                } else {
                    throw new RuntimeException("Unauthorized or User not found");
                }
            } else {
                throw new RuntimeException("Invalid token");
            }
        });
    }

    // Login: Authenticate and generate JWT token
    @Async
    @Cacheable(value = "users", key = "#loginRequest.username", unless = "#result == null")
    public CompletableFuture<String> login(loginModels loginRequest) {
        return CompletableFuture.supplyAsync(() -> {
            LOGGER.log(Level.INFO, "Login attempt for username: {0}", loginRequest.getUsername());
            UserModels user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
                LOGGER.log(Level.INFO, "Login successful for user: {0}", user.getUsername());
                return token;
            } else {
                LOGGER.log(Level.WARNING, "Login failed: Incorrect password for user {0}", loginRequest.getUsername());
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
            Optional<String> usernameOpt = jwtUtil.extractUsername(token);
            Optional<Role> roleOpt = jwtUtil.extractRole(token);

            if (usernameOpt.isPresent() && roleOpt.isPresent()) {
                return jwtUtil.validateToken(token, usernameOpt.get(), roleOpt.get());
            } else {
                return false;
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error validating JWT: {0}", e.getMessage());
            return false;
        }
    }

    // Method to get user info from token
    public CompletableFuture<UserDTO> getUserFromToken(String token) {
        return CompletableFuture.supplyAsync(() -> {
            Optional<String> usernameOpt = jwtUtil.extractUsername(token);
            if (usernameOpt.isPresent()) {
                UserModels user = userRepository.findByUsername(usernameOpt.get())
                        .orElseThrow(() -> new RuntimeException("User not found"));
                return convertToDto(user, token);
            } else {
                throw new RuntimeException("Invalid token");
            }
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