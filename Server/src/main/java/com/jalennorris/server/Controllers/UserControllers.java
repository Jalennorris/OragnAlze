package com.jalennorris.server.Controllers;
import com.jalennorris.server.Models.UserModels;
import com.jalennorris.server.Models.loginModels;
import com.jalennorris.server.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/users")
public class UserControllers {

    private final UserService userService;

    // Constructor-based injection
    @Autowired
    public UserControllers(UserService userService) {
        this.userService = userService;
    }

    // Get all users
    @GetMapping
    public CompletableFuture<ResponseEntity<List<UserModels>>> getUsers() {
        return userService.getALLUser()
                .thenApply(users -> ResponseEntity.ok(users));
    }

    // Get a user by ID
    @GetMapping("/{id}")
    public CompletableFuture<ResponseEntity<UserModels>> getUser(@PathVariable("id") long id) {
        return userService.getUserById(id)
                .thenApply(user -> user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build());
    }

    // Create a new user
    @PostMapping
    public CompletableFuture<ResponseEntity<UserModels>> createUser(@RequestBody UserModels newUser) {
        return userService.creatUser(newUser)
                .thenApply(createdUser -> ResponseEntity.status(201).body(createdUser)); // Return 201 Created
    }

    // Update a user by ID
    @PutMapping("/{id}")
    public CompletableFuture<ResponseEntity<UserModels>> updateUser(@PathVariable long id, @RequestBody UserModels updatedUser) {
        return userService.updateUser(id, updatedUser)
                .thenApply(updated -> updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build());
    }

    // Delete a user by ID
    @DeleteMapping("/{id}")
    public CompletableFuture<ResponseEntity<Void>> deleteUser(@PathVariable long id) {
        return userService.deleteUser(id)
                .thenApply(isDeleted -> isDeleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build());
    }

    // User login
    @PostMapping("/login")
    public CompletableFuture<ResponseEntity<String>> login(@RequestBody loginModels loginRequest) {
        return userService.login(loginRequest)
                .thenApply(loginMessage -> loginMessage != null ? ResponseEntity.ok(loginMessage) : ResponseEntity.status(401).body("Invalid credentials"));
    }
}