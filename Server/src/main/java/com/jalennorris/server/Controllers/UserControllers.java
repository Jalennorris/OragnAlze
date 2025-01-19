package com.jalennorris.server.Controllers;

import com.jalennorris.server.Models.UserModels;
import com.jalennorris.server.Models.loginModels;
import com.jalennorris.server.dto.UserDTO;
import com.jalennorris.server.service.UserService;
import com.jalennorris.server.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/users")
public class UserControllers {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Autowired
    public UserControllers(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/welcome")
    public String welcome() {
        return "Welcome this endpoint is not secure";
    }

    // Get all users (Admin-only protected route)
    @GetMapping
    public CompletableFuture<ResponseEntity<List<UserDTO>>> getUsers(@RequestHeader("Authorization") String token) {
        if (isAdmin(token)) {
            return userService.getAllUsers(token) // Pass token to the service
                    .thenApply(users -> ResponseEntity.ok(users)); // Returning DTO list
        } else {
            return CompletableFuture.completedFuture(ResponseEntity.status(403).body(null)); // Forbidden
        }
    }

    // Get a user by ID (Protected route for all users)
    @GetMapping("/{id}")
    public CompletableFuture<ResponseEntity<UserDTO>> getUser(@PathVariable("id") long id, @RequestHeader("Authorization") String token) {
        if (isValidJwt(token)) {
            return userService.getUserById(id, token)  // Pass token for user verification
                    .thenApply(user -> user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build()); // Returning DTO
        } else {
            return CompletableFuture.completedFuture(ResponseEntity.status(403).build()); // Forbidden
        }
    }

    // Create a new user
    @PostMapping
    public CompletableFuture<ResponseEntity<UserDTO>> createUser(@RequestBody UserModels newUser) {
        return userService.createUser(newUser)
                .thenApply(createdUser -> ResponseEntity.status(201).body(createdUser)); // Returning DTO
    }

    // Update a user by ID (Protected route)
    @PutMapping("/{id}")
    public CompletableFuture<ResponseEntity<UserDTO>> updateUser(@PathVariable long id, @RequestBody UserModels updatedUser, @RequestHeader("Authorization") String token) {
        if (isValidJwt(token)) {
            return userService.updateUser(id, updatedUser, token)  // Pass token for user verification
                    .thenApply(updated -> updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build()); // Returning DTO
        } else {
            return CompletableFuture.completedFuture(ResponseEntity.status(403).build()); // Forbidden
        }
    }

    // Delete a user by ID (Protected route)
    @DeleteMapping("/{id}")
    public CompletableFuture<ResponseEntity<Void>> deleteUser(@PathVariable long id, @RequestHeader("Authorization") String token) {
        if (isValidJwt(token)) {
            return userService.deleteUser(id, token)
                    .thenApply(isDeleted -> isDeleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build());
        } else {
            return CompletableFuture.completedFuture(ResponseEntity.status(403).build()); // Forbidden
        }
    }

    // User login
    @PostMapping("/login")
    public CompletableFuture<ResponseEntity<String>> login(@RequestBody loginModels loginRequest) {
        return userService.login(loginRequest)
                .thenApply(loginMessage -> loginMessage != null ? ResponseEntity.ok(loginMessage) : ResponseEntity.status(401).body("Invalid credentials"));
    }

    // Helper method to validate JWT token
    private boolean isValidJwt(String token) {
        try {
            return jwtUtil.validateToken(token, jwtUtil.extractUsername(token));
        } catch (Exception e) {
            return false;
        }
    }

    // Helper method to check if the user is an admin
    private boolean isAdmin(String token) {
        try {
            String role = jwtUtil.extractRole(token); // Assuming JWT contains a "role" claim
            return "admin".equals(role);
        } catch (Exception e) {
            return false;
        }
    }
}