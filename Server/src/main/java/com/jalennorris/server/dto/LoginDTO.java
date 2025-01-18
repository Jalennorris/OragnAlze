package com.jalennorris.server.dto;


public class LoginDTO {


    private String username;


    private String password;

    // Default constructor for Spring to use during deserialization
    public LoginDTO() {}

    // Constructor with parameters
    public LoginDTO(String username, String password) {
        this.username = username;
        this.password = password;
    }

    // Getter and Setter methods
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
}