package com.jalennorris.server;

import com.jalennorris.server.enums.Role;

public class LoginResponse {
    private String token;
    private Role role;
    private String username;
    private long userId;

    // Constructor
    public LoginResponse(String token, Role role, String username, long userId) {
        this.token = token;
        this.role = role;
        this.username = username;
        this.userId = userId;
    }

    // Getters and Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public long getUserId() {
        return userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
    }
}

