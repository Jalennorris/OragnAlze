package com.jalennorris.server.service;

import com.jalennorris.server.Models.UserModels;
import com.jalennorris.server.Models.loginModels;
import com.jalennorris.server.Repository.UserRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service // Marking this as a Spring-managed service
public class UserService {

    private final UserRepository userRepository;

    // Constructor-based injection for UserRepository
    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
@Cacheable(value = "users", key="#user.id")
    public UserModels creatUser(UserModels user) {
        return userRepository.save(user);
    }
@Cacheable(value = "users")
    public List<UserModels> getALLUser() {
        return userRepository.findAll();
    }
    @Cacheable (value = "users", key="#id")
    public UserModels getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }
    @CacheEvict(value = "users", key = "#id")
    public UserModels updateUser(Long id, UserModels user) {
        UserModels existingUser = userRepository.findById(id).orElse(null);
        if (existingUser != null) {
            existingUser.setFirstname(user.getFirstname());
            existingUser.setLastname(user.getLastname());
            existingUser.setEmail(user.getEmail());
            existingUser.setPassword(user.getPassword());
            return userRepository.save(existingUser);
        }
        return null;
    }
    @CacheEvict(value = "users", key = "#id")
    public boolean deleteUser(long id) {
        if (userRepository.existsById(id)) { // Check if the user exists
            userRepository.deleteById(id);  // Delete the user
            return true;                    // Return true for successful deletion
        }
        return false; // Return false if the user doesn't exist
    }
    @Cacheable(value = "users", key = "#loginRequest.username")
    public String login(loginModels loginRequest) {
        UserModels user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getPassword().equals(loginRequest.getPassword())) {
            return "Logged in successfully";
        } else {
            return "Incorrect username or password";
        }
    }
}



