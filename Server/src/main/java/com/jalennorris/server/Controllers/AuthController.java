package com.jalennorris.server.Controllers;

import com.jalennorris.server.LoginResponse;
import com.jalennorris.server.Models.UserModels;
import com.jalennorris.server.Models.loginModels;
import com.jalennorris.server.Repository.UserRepository;
import com.jalennorris.server.dto.UserDTO;
import com.jalennorris.server.enums.Role;
import com.jalennorris.server.service.UserService;
import com.jalennorris.server.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;
import java.util.concurrent.CompletableFuture;


@CrossOrigin(
        origins = {"http://localhost:8081"}
)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Autowired
    public AuthController(UserService userService, JwtUtil jwtUtil, UserRepository userRepository) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public CompletableFuture<ResponseEntity<String>> registerUser(@RequestBody UserModels newUser) {
        return userService.createUser(newUser)
                .thenApply(createdUser -> {
                    // Generate JWT token for the newly created user
                    String token = jwtUtil.generateToken(createdUser.getUsername(), createdUser.getRole());
                    return ResponseEntity.status(201).body("User registered successfully. Token: " + token);
                })
                .exceptionally(ex -> {
                    log.error("Error during registration: {}", ex.getMessage());
                    return ResponseEntity.status(500).body("Server error: An unexpected error occurred");
                });
    }

    // User login
    @PostMapping("/login")
    public CompletableFuture<ResponseEntity<LoginResponse>> login(@RequestBody loginModels loginRequest) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Authenticate the user manually
                Optional<UserModels> userOpt = userRepository.findByUsername(loginRequest.getUsername());
                if (userOpt.isPresent()) {
                    UserModels user = userOpt.get();
                    if (user.getPassword().equals(loginRequest.getPassword())) {
                        // Load user details and generate token
                        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

                        log.info("User '{}' successfully logged in. Token generated.", loginRequest.getUsername());
                        log.info("User Role: {}", user.getRole());
                        log.info("Generated Token: {}", token);

                        // Create the response object
                        LoginResponse loginResponse = new LoginResponse(token, user.getRole(), user.getUsername(), user.getUserId());

                        return ResponseEntity.ok(loginResponse);
                    } else {
                        log.warn("Invalid credentials for user '{}'.", loginRequest.getUsername());
                        return ResponseEntity.status(401).body(null);
                    }
                } else {
                    log.warn("User '{}' not found.", loginRequest.getUsername());
                    return ResponseEntity.status(401).body(null);
                }
            } catch (Exception ex) {
                log.error("Error during login attempt for username '{}': {}", loginRequest.getUsername(), ex.getMessage(), ex);
                return ResponseEntity.status(500).body(null);
            }
        });
    }

    // Helper method to validate JWT token
    private boolean isValidJwt(String token) {
        try {
            Optional<String> usernameOpt = jwtUtil.extractUsername(token);
            Optional<Role> roleOpt = jwtUtil.extractRole(token);

            if (usernameOpt.isPresent() && roleOpt.isPresent()) {
                return jwtUtil.validateToken(token, usernameOpt.get(), roleOpt.get());
            } else {
                return false;
            }
        } catch (Exception e) {
            log.error("JWT validation error: {}", e.getMessage());
            return false;
        }
    }
}