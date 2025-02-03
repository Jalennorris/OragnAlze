package com.jalennorris.server;

import com.jalennorris.server.enums.Role;

public class LoginResponse {
    private String token;
    private Role role;
    private String username;
    private long userId;
    private String display_name;
    private String profile_pic;
    private String password;
    private String firstname;
    private String lastname;
    private String email;

    // Constructor
    public LoginResponse(String token, Role role, String username, long userId, String display_name, String profile_pic, String password, String firstname, String lastname, String email) {
        this.token = token;
        this.role = role;
        this.username = username;
        this.userId = userId;
        this.password =password;
        this.display_name = display_name;
        this.profile_pic = profile_pic;
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
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

    public String getDisplay_name() {
        return display_name;
    }

    public void setDisplay_name(String display_name) {
        this.display_name = display_name;
    }

    public String getProfile_pic() {
        return profile_pic;
    }

    public void setProfile_pic(String profile_pic) {
        this.profile_pic = profile_pic;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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
}

