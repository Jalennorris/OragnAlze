package com.jalennorris.server.service;

import com.jalennorris.server.Models.UserModels;
import com.jalennorris.server.Models.loginModels;
import com.jalennorris.server.Repository.UserRepository;
import com.jalennorris.server.enums.Role;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import com.jalennorris.server.dto.UserDTO;
import com.jalennorris.server.util.JwtUtil;



import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Autowired
    public UserService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }


    // Helper method to convert UserModels to UserDTO
    private UserDTO convertToDto(UserModels userModel, String token) {

        return new UserDTO(
                userModel.getUserId(),
                userModel.getFirstname(),
                userModel.getLastname(),
                userModel.getEmail(),
                userModel.getUsername(),
                userModel.getRole(), // Pass extracted role
                token // Pass token
        );
    }

    // Register a new user (Save user and generate token)
    @Async
    @CacheEvict(value = "users", allEntries = true)
    public CompletableFuture<UserDTO> createUser(UserModels user) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                UserModels savedUser = userRepository.save(user);
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
                return convertToDto(savedUser, token);
            } catch (Exception e) {
                // Log the error
                System.err.println("Error creating user: " + e.getMessage());
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
            if (!isAdmin(username)) { // Check if user is admin
                throw new RuntimeException("Unauthorized access. Admins only.");
            }
            List<UserModels> users = userRepository.findAll();
            return users.stream()
                    .map(user -> convertToDto(user, null)) // No token needed in this context
                    .toList();
        });
    }

    // Get user by id (Admin or user with token)
    @Async
    @Cacheable(value = "users", key = "#id", unless = "#result == null")
    public CompletableFuture<UserDTO> getUserById(Long id, String token) {
        return CompletableFuture.supplyAsync(() -> {
            String username = jwtUtil.extractUsername(token);
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
            if (!user.getUsername().equals(usernameFromToken)) {
                throw new RuntimeException("Unauthorized to update this user.");
            }

            UserModels existingUser = userRepository.findById(id).orElse(null);
            if (existingUser != null) {
                existingUser.setFirstname(user.getFirstname());
                existingUser.setLastname(user.getLastname());
                existingUser.setEmail(user.getEmail());
                existingUser.setPassword(user.getPassword());
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
            UserModels user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            if (user.getPassword().equals(loginRequest.getPassword())) {
                return jwtUtil.generateToken(user.getUsername(),user.getRole()); // Generate and return token
            } else {
                throw new RuntimeException("Incorrect username or password");
            }
        });
    }

    // Check if user is an admin (for access control)
    private boolean isAdmin(String username) {
        return userRepository.findByUsername(username)
                .map(user -> Role.ADMIN.equals(user.getRole())) // Compare with enum instead of string
                .orElse(false);
    }
    // Method to validate JWT
    public boolean isValidJwt(String token) {
        try {
            String username = jwtUtil.extractUsername(token);
            if (username == null || !jwtUtil.validateToken(token, username, Role.USER)) { // Add appropriate role check
                return false;
            }
            return true;
        } catch (Exception e) {
            System.err.println("Error validating JWT: " + e.getMessage()); // Log the exception for debugging
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

    public CompletableFuture<UserDTO> createUserIfNotExist(UserModels user) {
        return CompletableFuture.supplyAsync(() -> {
            // Check if user already exists
            if (userRepository.findByUsername(user.getUsername()).isPresent()) {
                throw new RuntimeException("User with username " + user.getUsername() + " already exists.");
            }

            try {
                // Skip password encoding (no hashing of the password)
                // Save the new user
                UserModels savedUser = userRepository.save(user);
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

                // Return the DTO for the saved user
                return convertToDto(savedUser, token);
            } catch (Exception e) {
                throw new RuntimeException("Error creating user: " + e.getMessage());
            }
        });

    }
    public boolean createUserIfNotExist(loginModels loginRequest) {
        Optional<UserModels> existingUser = userRepository.findByUsername(loginRequest.getUsername());
        if (existingUser.isPresent()) {
            return false; // User already exists, don't create a new one
        } else {
            // Create a new user
            UserModels newUser = new UserModels();
            newUser.setUsername(loginRequest.getUsername());
            newUser.setPassword(loginRequest.getPassword()); // Ensure password is encrypted
            newUser.setRole(Role.USER); // Assign a default role or any logic as per your requirements
            userRepository.save(newUser); // Save the user in the repository
            return true; // New user created successfully
        }
    }
}