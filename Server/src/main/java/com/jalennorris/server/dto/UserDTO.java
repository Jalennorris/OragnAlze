package com.jalennorris.server.dto;

import java.io.Serializable;
import com.jalennorris.server.enums.Role;

public class UserDTO implements Serializable {

    private static final long serialVersionUID = 1L; // Add a serialVersionUID

    private Long userId;
    private String firstname;
    private String lastname;
    private String email;
    private String username;
    private String password;
    private Role role;
    private String token;
    private String display_name;
    private String profile_pic;
    private Boolean isDarkMode = false; // Default value


    // Constructor
    public UserDTO(Long userId, String firstname, String lastname, String email, String username,  String password,Role role, String token, String display_name, String profile_pic, Boolean isDarkMode) {
        this.userId = userId;
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
        this.username = username;
        this.password = password;
        this.role = role;
        this.token = token;
        this.display_name = display_name;
        this.profile_pic = profile_pic;
        this.isDarkMode = false; // Default value
    }

    // Getters and Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public Boolean getIsDarkMode(){
        return isDarkMode;
    }

    public void setIsDarkMode(Boolean isDarkMode){
        this.isDarkMode = isDarkMode;

    }
}