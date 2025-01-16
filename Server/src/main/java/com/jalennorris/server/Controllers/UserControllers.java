package com.jalennorris.server.Controllers;

import com.jalennorris.server.Models.UserModels;
import com.jalennorris.server.Models.loginModels;
import com.jalennorris.server.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserControllers {

    private final UserService userService;


    // Constructor-based injection
    @Autowired
    public UserControllers( UserService userService) {

        this.userService = userService;
    }

    // Get all users
    @GetMapping
    public ResponseEntity<List<UserModels>> getUsers() {
        List<UserModels> users = userService.getALLUser();
        return ResponseEntity.ok(users);
    }

    // Get a user by ID
    @GetMapping("/{id}")
    public ResponseEntity<UserModels> getUser(@PathVariable("id") long id) {
        UserModels user = userService.getUserById(id);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    // Create a new user
    @PostMapping
    public ResponseEntity<UserModels> createUser(@RequestBody UserModels newUser) {
        UserModels createdUser = userService.creatUser(newUser);
        return ResponseEntity.status(201).body(createdUser); // Return 201 Created
    }

    // Update a user by ID
    @PutMapping("/{id}")
    public ResponseEntity<UserModels> updateUser(@PathVariable long id, @RequestBody UserModels updatedUser) {
        UserModels updated = userService.updateUser(id, updatedUser);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    // Delete a user by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable long id) {
        boolean isDeleted = userService.deleteUser(id);
        return isDeleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    // User login
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody loginModels loginRequest) {
        String loginMessage = userService.login(loginRequest);
        return loginMessage != null ? ResponseEntity.ok(loginMessage) : ResponseEntity.status(401).body("Invalid credentials");
    }
}