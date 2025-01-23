package com.jalennorris.server.Controllers;

import com.jalennorris.server.Models.UserModels;
import com.jalennorris.server.Models.loginModels;
import com.jalennorris.server.Repository.UserRepository;
import com.jalennorris.server.dto.UserDTO;
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
    public CompletableFuture<ResponseEntity<UserDTO>> registerUser(@RequestBody UserModels newUser) {
        return userService.createUser(newUser)
                .thenApply(createdUser -> ResponseEntity.status(201).body(createdUser));
    }

    // User login
    @PostMapping("/login")
    public CompletableFuture<ResponseEntity<String>> login(@RequestBody loginModels loginRequest) {
        return userService.login(loginRequest)
                .thenApply(token -> {
                    // Authenticate the user
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    loginRequest.getUsername(),
                                    loginRequest.getPassword()
                            )
                    );
                    UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUsername());
                    UserModels user = userRepository.findByUsername(loginRequest.getUsername()).orElse(null);

                    if (user != null) {
                        log.info("User '{}' successfully logged in. Token generated.", loginRequest.getUsername());
                        log.info("User Role: {}", user.getRole());
                        log.info("Generated Token: {}", token);
                        return ResponseEntity.ok("Login successful. Token: " + token + ", Role: " + user.getRole());
                    } else {
                        log.warn("Login failed for user '{}'. Attempting to create new user.", loginRequest.getUsername());
                        boolean isUserCreated = userService.createUserIfNotExist(loginRequest);

                        if (isUserCreated) {
                            log.info("New user '{}' created successfully.", loginRequest.getUsername());
                            return ResponseEntity.status(201).body("New user created. You can now log in.");
                        } else {
                            log.error("Failed to create user '{}'. User already exists or error occurred.", loginRequest.getUsername());
                            return ResponseEntity.status(401).body("Invalid credentials: Incorrect username or password");
                        }
                    }
                })
                .exceptionally(ex -> {
                    log.error("Error during login attempt for username '{}': {}", loginRequest.getUsername(), ex.getMessage(), ex);
                    return ResponseEntity.status(500).body("Server error: An unexpected error occurred");
                });
    }

    // Helper method to validate JWT token
    private boolean isValidJwt(String token) {
        try {
            return jwtUtil.validateToken(token, jwtUtil.extractUsername(token), jwtUtil.extractRole(token));
        } catch (Exception e) {
            return false;
        }
    }
}