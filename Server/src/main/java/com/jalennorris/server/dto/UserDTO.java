package com.jalennorris.server.dto;

import com.jalennorris.server.enums.Role;

public class UserDTO {

    private long userId;
    private String firstname;
    private String lastname;
    private String email;
    private String username;
    private Role role; // New field for roles
    private String token; // Token for authentication

    // Default constructor
    public UserDTO() {}

    // Parameterized constructor
    public UserDTO(long userId, String firstname, String lastname, String email, String username, Role role, String token) {
        this.userId = userId;
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
        this.username = username;
        this.role = role;
        this.token = token;
    }

    // Getters and setters
    public long getUserId() {
        return userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
    }

    public String getFirstname() {
        return firstname;
    }

    public void setFirstname(String firstname) {
        this.firstname = firstname;
    }

    public String getLastname() {
        return lastname;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}