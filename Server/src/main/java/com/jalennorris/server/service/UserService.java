package com.jalennorris.server.service;

import com.jalennorris.server.Models.UserModels;
import com.jalennorris.server.Models.loginModels;
import com.jalennorris.server.Repository.UserRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import com.jalennorris.server.dto.UserDTO;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import com.jalennorris.server.util.JwtUtil;

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
    private UserDTO convertToDto(UserModels userModel) {
        return new UserDTO(
                userModel.getUserId(),
                userModel.getFirstname(),
                userModel.getLastname(),
                userModel.getEmail(),
                userModel.getUsername()
        );
    }

    // Register a new user (Save user)
    @Async
    @CacheEvict(value = "users", allEntries = true) // Evict cache when a new user is created
    public CompletableFuture<UserDTO> createUser(UserModels user) {
        return CompletableFuture.supplyAsync(() -> {
            UserModels savedUser = userRepository.save(user);
            return convertToDto(savedUser); // Convert to DTO before returning
        });
    }

    // Get all users
    @Async
    @Cacheable(value = "users", unless = "#result == null || #result.isEmpty()") // Cache only if result is not empty
    public CompletableFuture<List<UserDTO>> getAllUsers() {
        return CompletableFuture.supplyAsync(() -> {
            List<UserModels> users = userRepository.findAll();
            return users.stream().map(this::convertToDto).toList(); // Convert each user to DTO
        });
    }

    // Get user by id
    @Async
    @Cacheable(value = "users", key = "#id", unless = "#result == null") // Cache by user ID
    public CompletableFuture<UserDTO> getUserById(Long id) {
        return CompletableFuture.supplyAsync(() -> {
            UserModels user = userRepository.findById(id).orElse(null);
            return user != null ? convertToDto(user) : null; // Convert to DTO if user exists
        });
    }

    // Update user details
    @Async
    @CacheEvict(value = "users", key = "#id") // Evict cache for updated user
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
                return convertToDto(updatedUser); // Convert to DTO before returning
            }
            return null;
        });
    }

    // Delete user by ID
    @Async
    @CacheEvict(value = "users", key = "#id") // Evict cache for deleted user
    public CompletableFuture<Boolean> deleteUser(long id, String token) {
        return CompletableFuture.supplyAsync(() -> {
            String usernameFromToken = jwtUtil.extractUsername(token);
            UserModels user = userRepository.findById(id).orElse(null);
            if (user != null && usernameFromToken.equals(user.getUsername())) {
                userRepository.deleteById(id);
                return true;
            } else {
                throw new RuntimeException("Unauthorized or User not found");
            }
        });
    }

    // Login: Authenticate and generate JWT token
    @Async
    @Cacheable(value = "users", key = "#loginRequest.username", unless = "#result == null") // Cache JWT token by username
    public CompletableFuture<String> login(loginModels loginRequest) {
        return CompletableFuture.supplyAsync(() -> {
            UserModels user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            if (user.getPassword().equals(loginRequest.getPassword())) {
                // Generate and return JWT token
                String token = jwtUtil.generateToken(user.getUsername());
                return token;
            } else {
                throw new RuntimeException("Incorrect username or password");
            }
        });
    }

    // Method to validate JWT (for use across protected routes)
    public boolean isValidJwt(String token) {
        try {
            String username = jwtUtil.extractUsername(token);
            return jwtUtil.validateToken(token, username);
        } catch (Exception e) {
            return false;
        }
    }

    // Method to get user info from token (for protected routes)
    public CompletableFuture<UserDTO> getUserFromToken(String token) {
        return CompletableFuture.supplyAsync(() -> {
            String username = jwtUtil.extractUsername(token);
            UserModels user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return convertToDto(user); // Convert to DTO before returning
        });
    }
}