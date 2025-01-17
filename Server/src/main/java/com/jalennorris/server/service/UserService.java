package com.jalennorris.server.service;

import com.jalennorris.server.Models.UserModels;
import com.jalennorris.server.Models.loginModels;
import com.jalennorris.server.Repository.UserRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service // Marking this as a Spring-managed service
public class UserService {

    private final UserRepository userRepository;

    // Constructor-based injection for UserRepository
    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Async
    @Cacheable(value = "users", key = "#user.id")
    public CompletableFuture<UserModels> creatUser(UserModels user) {
        return CompletableFuture.supplyAsync(() -> userRepository.save(user));
    }

    @Async
    @Cacheable(value = "users")
    public CompletableFuture<List<UserModels>> getALLUser() {
        return CompletableFuture.supplyAsync(userRepository::findAll);
    }

    @Async
    @Cacheable(value = "users", key = "#id")
    public CompletableFuture<UserModels> getUserById(Long id) {
        return CompletableFuture.supplyAsync(() -> userRepository.findById(id).orElse(null));
    }

    @Async
    @CacheEvict(value = "users", key = "#id")
    public CompletableFuture<UserModels> updateUser(Long id, UserModels user) {
        return CompletableFuture.supplyAsync(() -> {
            UserModels existingUser = userRepository.findById(id).orElse(null);
            if (existingUser != null) {
                existingUser.setFirstname(user.getFirstname());
                existingUser.setLastname(user.getLastname());
                existingUser.setEmail(user.getEmail());
                existingUser.setPassword(user.getPassword());
                return userRepository.save(existingUser);
            }
            return null;
        });
    }

    @Async
    @CacheEvict(value = "users", key = "#id")
    public CompletableFuture<Boolean> deleteUser(long id) {
        return CompletableFuture.supplyAsync(() -> {
            if (userRepository.existsById(id)) {
                userRepository.deleteById(id);
                return true;
            }
            return false;
        });
    }

    @Async
    @Cacheable(value = "users", key = "#loginRequest.username")
    public CompletableFuture<String> login(loginModels loginRequest) {
        return CompletableFuture.supplyAsync(() -> {
            UserModels user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            if (user.getPassword().equals(loginRequest.getPassword())) {
                return "Logged in successfully";
            } else {
                return "Incorrect username or password";
            }
        });
    }
}


