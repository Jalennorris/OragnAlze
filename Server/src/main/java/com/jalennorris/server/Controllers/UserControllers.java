package com.jalennorris.server.Controllers;

import com.jalennorris.server.Models.UserModels;
import com.jalennorris.server.dto.UserDTO;
import com.jalennorris.server.service.UserService;
import com.jalennorris.server.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/users")
public class UserControllers {

    private static final Logger log = LoggerFactory.getLogger(UserControllers.class);
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Autowired
    public UserControllers(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/welcome")
    public String welcome() {
        return "Welcome, this endpoint is not secure";
    }

    // Public endpoint
    @GetMapping("/public")
    public CompletableFuture<ResponseEntity<List<UserDTO>>> getPublicUsers() {
        log.info("Fetching all users (public)");
        return userService.getAllUsers("public-token")
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> {
                    log.error("Error fetching users: ", ex);
                    return ResponseEntity.status(500).build();
                });
    }

    // Private endpoint
    @GetMapping
    public CompletableFuture<ResponseEntity<List<UserDTO>>> getUsers(@RequestHeader("Authorization") String token) {
        log.info("Fetching all users with token: " + token);

        // Log security context details
        log.info("SecurityContext Authentication: " + SecurityContextHolder.getContext().getAuthentication());
        log.info("Authorities: " + SecurityContextHolder.getContext().getAuthentication().getAuthorities());

        return userService.getAllUsers(token)
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> {
                    log.error("Error fetching users: ", ex);
                    return ResponseEntity.status(403).build();
                });
    }

    @GetMapping("/{id}")
    public CompletableFuture<ResponseEntity<UserDTO>> getUser(@PathVariable("id") long id, @RequestHeader("Authorization") String token) {
        return userService.getUserById(id, token)
                .thenApply(user -> user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public CompletableFuture<ResponseEntity<UserDTO>> updateUser(@PathVariable long id, @RequestBody UserModels updatedUser, @RequestHeader("Authorization") String token) {
        return userService.updateUser(id, updatedUser, token)
                .thenApply(updated -> updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public CompletableFuture<ResponseEntity<Void>> deleteUser(@PathVariable long id, @RequestHeader("Authorization") String token) {
        return userService.deleteUser(id, token)
                .thenApply(isDeleted -> isDeleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build());
    }
}