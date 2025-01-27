package com.jalennorris.server.Controllers;

import com.jalennorris.server.Models.UserModels;
import com.jalennorris.server.Models.loginModels;
import com.jalennorris.server.Repository.UserRepository;
import com.jalennorris.server.dto.UserDTO;
import com.jalennorris.server.enums.Role;
import com.jalennorris.server.service.UserService;
import com.jalennorris.server.util.JwtUtil;
import com.jalennorris.server.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;

    @Autowired
    public AuthController(UserService userService, JwtUtil jwtUtil, UserRepository userRepository, AuthenticationManager authenticationManager, CustomUserDetailsService userDetailsService) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
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
    public CompletableFuture<ResponseEntity<String>> login(@RequestBody loginModels loginRequest) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Authenticate the user
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                loginRequest.getUsername(),
                                loginRequest.getPassword()
                        )
                );

                // Load user details and generate token
                UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUsername());
                String token = jwtUtil.generateToken(loginRequest.getUsername(), Role.USER); // Assuming default role as USER

                // Retrieve user from repository
                UserModels user = userRepository.findByUsername(loginRequest.getUsername()).orElse(null);

                if (user != null) {
                    log.info("User '{}' successfully logged in. Token generated.", loginRequest.getUsername());
                    log.info("User Role: {}", user.getRole());
                    log.info("Generated Token: {}", token);
                    return ResponseEntity.ok("Login successful. Token: " + token + ", Role: " + user.getRole());
                } else {
                    log.warn("User '{}' not found.", loginRequest.getUsername());
                    return ResponseEntity.status(401).body("Invalid credentials: Incorrect username or password");
                }
            } catch (Exception ex) {
                log.error("Error during login attempt for username '{}': {}", loginRequest.getUsername(), ex.getMessage(), ex);
                return ResponseEntity.status(500).body("Server error: An unexpected error occurred");
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