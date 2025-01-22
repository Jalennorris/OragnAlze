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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/users")
public class UserControllers {

    private static final Logger log = LoggerFactory.getLogger(UserControllers.class);
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;

    @Autowired
    public UserControllers(UserService userService, JwtUtil jwtUtil, UserRepository userRepository, AuthenticationManager authenticationManager, CustomUserDetailsService userDetailsService) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }

    @GetMapping("/welcome")
    public String welcome() {
        return "Welcome, this endpoint is not secure";
    }

    // Get all users (Admin-only protected route)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CompletableFuture<ResponseEntity<List<UserDTO>>> getUsers(@RequestHeader("Authorization") String token) {
        return userService.getAllUsers(token)
                .thenApply(ResponseEntity::ok);
    }

    // Get a user by ID (Protected route for all users)
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public CompletableFuture<ResponseEntity<UserDTO>> getUser(@PathVariable("id") long id, @RequestHeader("Authorization") String token) {
        return userService.getUserById(id, token)
                .thenApply(user -> user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build());
    }

    // Create a new user
    @PostMapping
    @PreAuthorize("permitAll()")
    public CompletableFuture<ResponseEntity<UserDTO>> createUser(@RequestBody UserModels newUser) {
        return userService.createUser(newUser)
                .thenApply(createdUser -> ResponseEntity.status(201).body(createdUser));
    }

    // Update a user by ID (Admin-only protected route)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CompletableFuture<ResponseEntity<UserDTO>> updateUser(@PathVariable long id, @RequestBody UserModels updatedUser, @RequestHeader("Authorization") String token) {
        return userService.updateUser(id, updatedUser, token)
                .thenApply(updated -> updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build());
    }

    // Delete a user by ID (Admin-only protected route)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CompletableFuture<ResponseEntity<Void>> deleteUser(@PathVariable long id, @RequestHeader("Authorization") String token) {
        return userService.deleteUser(id, token)
                .thenApply(isDeleted -> isDeleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build());
    }

    // User login
    @PostMapping("/login")
    @PreAuthorize("permitAll()")
    public CompletableFuture<ResponseEntity<String>> login(@RequestBody loginModels loginRequest) {
        return userService.login(loginRequest)
                .thenApply(token -> {
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