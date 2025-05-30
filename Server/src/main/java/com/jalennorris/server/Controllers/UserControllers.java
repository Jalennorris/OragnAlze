package com.jalennorris.server.Controllers;

import com.jalennorris.server.dto.UserDTO;
import com.jalennorris.server.service.UserService;
import com.jalennorris.server.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.web.bind.annotation.*;
import  com.jalennorris.server.dto.ChangePasswordRequest;
import  com.jalennorris.server.Response.ChangePasswordResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@CrossOrigin(origins = {"http://localhost:8081"})
@RestController
@RequestMapping("/api/users")
public class UserControllers {

    private static final Logger log = LoggerFactory.getLogger(UserControllers.class);
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final StringHttpMessageConverter stringHttpMessageConverter;

    @Autowired
    public UserControllers(UserService userService, JwtUtil jwtUtil, StringHttpMessageConverter stringHttpMessageConverter) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.stringHttpMessageConverter = stringHttpMessageConverter;
    }

    @GetMapping("/welcome")
    public String welcome() {
        return "Welcome, this endpoint is not secure";
    }

    // Public endpoint
    @GetMapping("/public")
    public CompletableFuture<ResponseEntity<List<UserDTO>>> getPublicUsers() {
        log.info("Fetching all users (public)");
        return userService.getAllUsers()
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> {
                    log.error("Error fetching users: ", ex);
                    return ResponseEntity.status(500).build();
                });
    }

    // Private endpoint (token not required)
    @GetMapping
    public CompletableFuture<ResponseEntity<List<UserDTO>>> getUsers() {
        log.info("Fetching all users");
        return userService.getAllUsers()
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> {
                    log.error("Error fetching users: ", ex);
                    return ResponseEntity.status(500).build();
                });
    }

    @GetMapping("/{id}")
    public CompletableFuture<ResponseEntity<UserDTO>> getUser(@PathVariable("id") long id) {
        return userService.getUserById(id)
                .thenApply(user -> user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public CompletableFuture<ResponseEntity<UserDTO>> updateUser(@PathVariable long id, @RequestBody Map<String, Object> updates) {
        return userService.updateUser(id, updates)
                .thenApply(updated -> updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public CompletableFuture<ResponseEntity<Void>> deleteUser(@PathVariable long id) {
        return userService.deleteUser(id)
                .thenApply(isDeleted -> isDeleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/change-password")
    public ResponseEntity<ChangePasswordResponse> changePassword(@PathVariable Long id, @RequestBody ChangePasswordRequest request) {
        String newToken = userService.changePassword(id, request.getCurrentPassword(), request.getNewPassword())
                .join();
        return ResponseEntity.ok(new ChangePasswordResponse(newToken));
    }
}