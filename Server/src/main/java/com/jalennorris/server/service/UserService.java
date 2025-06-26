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
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.Map;


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
        LOGGER.log(Level.INFO, "Converting UserModels to UserDTO: {0}", userModel);
        return new UserDTO(

                //aways make sure this in order
                userModel.getUserId(),
                userModel.getFirstname(),
                userModel.getLastname(),
                userModel.getEmail(),
                userModel.getUsername(),
                userModel.getPassword(),
                userModel.getRole(),

                token, // Ensure token is passed correctly
                userModel.getDisplay_name(),// Set display_name as a concatenation of first and last name
                userModel.getProfile_pic() // Ensure this field is correctly mapped
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

                // Save the user
                UserModels savedUser = userRepository.save(user);

                // Generate a token
                String token = jwtUtil.generateToken(user.getUsername(), Role.USER); // Ensure Role.USER is used

                // Convert to DTO with token
                return convertToDto(savedUser, token);
            } catch (Exception e) {
                LOGGER.log(Level.SEVERE, "Error creating user: {0}", e.getMessage());
                throw new RuntimeException("Error creating user: " + e.getMessage(), e);
            }
        });
    }

    // Get all users
    @Async
    @Cacheable(value = "users", unless = "#result == null || #result.isEmpty()")
    public CompletableFuture<List<UserDTO>> getAllUsers() {
        return CompletableFuture.supplyAsync(() -> {
            List<UserModels> users = userRepository.findAll();
            return users.stream()
                    .map(user -> convertToDto(user, null))
                    .toList();
        });
    }

    // Get user by id
    @Async
    @Cacheable(value = "users", key = "#id", unless = "#result == null")
    public CompletableFuture<UserDTO> getUserById(Long id) {
        return CompletableFuture.supplyAsync(() -> {
            UserModels user = userRepository.findById(id).orElse(null);

            if (user == null) {
                throw new RuntimeException("User not found");
            }

            return convertToDto(user, null);
        });
    }

    // Update user details
    @Transactional
    @Async
    @CacheEvict(value = "users", key = "#id")
    public CompletableFuture<UserDTO> updateUser(Long id, Map<String, Object> updates) {
        return CompletableFuture.supplyAsync(() -> {
            UserModels existingUser = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            updates.forEach((key, value) -> {
                switch (key) {
                    case "firstname":
                        existingUser.setFirstname((String) value);
                        break;
                    case "lastname":
                        existingUser.setLastname((String) value);
                        break;
                    case "email":
                        existingUser.setEmail((String) value);
                        break;
                    case "password":
                        existingUser.setPassword((String) value);
                        break;
                    case "display_name":
                        existingUser.setDisplay_name((String) value);
                        break;
                    case "username":
                        existingUser.setUsername((String) value);
                        break;
                    case "profile_pic":
                        existingUser.setProfile_pic((String) value);
                        break;
                    default:
                        throw new IllegalArgumentException("Invalid field: " + key);
                }
            });

            UserModels updatedUser = userRepository.save(existingUser);
            return convertToDto(updatedUser, null);
        });
    }

    // Update only the user's profile picture (URL or color hex)
    @Transactional
    public void updateUserProfilePic(long userId, String profilePicUrl) {
        UserModels user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setProfile_pic(profilePicUrl);
        userRepository.save(user);
    }

    // Delete user by ID
    @Async
    @CacheEvict(value = "users", key = "#id")
    public CompletableFuture<Boolean> deleteUser(long id) {
        return CompletableFuture.supplyAsync(() -> {
            UserModels user = userRepository.findById(id).orElse(null);
            if (user != null) {
                userRepository.deleteById(id);
                return true;
            } else {
                throw new RuntimeException("User not found");
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
            if (loginRequest.getPassword().equals(user.getPassword())) {
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
                LOGGER.log(Level.INFO, "Login successful for user: {0}", user.getUsername());
                return token;
            } else {
                LOGGER.log(Level.WARNING, "Login failed: Incorrect password for user {0}", loginRequest.getUsername());
                throw new RuntimeException("Incorrect username or password");
            }
        });
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
            newUser.setPassword(loginRequest.getPassword());
            newUser.setRole(Role.USER); // Ensure Role.USER is used
            userRepository.save(newUser);
            return true;
        }
    }

    //change password method

    @Async
    @Transactional
    public CompletableFuture<String> changePassword(long userId, String currentPassword, String newPassword) {
        return CompletableFuture.supplyAsync(() -> {
            UserModels user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!currentPassword.matches(user.getPassword())) {
                throw new RuntimeException("Current password is incorrect.");
            }

            user.setPassword(newPassword);
            userRepository.save(user);

            // Generate a new token
            return jwtUtil.generateToken(user.getUsername(), user.getRole());
        });
    }

}