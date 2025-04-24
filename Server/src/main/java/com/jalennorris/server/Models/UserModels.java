package com.jalennorris.server.Models;

import com.jalennorris.server.enums.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "users")
public class UserModels {

    // Unique identifier for the user
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id", nullable = false, updatable = false)
    private long user_id;

    // First name of the user
    @Size(min = 1, max = 50, message = "First name must be between 1 and 50 characters")
    @Column(name = "firstname", nullable = false)
    private String firstname;

    // Last name of the user
    @Size(min = 1, max = 50, message = "Last name must be between 1 and 50 characters")
    @Column(name = "lastname", nullable = false)
    private String lastname;

    // Email address of the user
    @NotNull(message = "Email cannot be null")
    @Email(message = "Email should be valid")
    @Column(unique = true, nullable = false)
    private String email;

    // Username for the user
    @NotNull(message = "Username cannot be null")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Column(name = "username", unique = true, nullable = false)
    private String username;

    // Password for the user
    @NotNull(message = "Password cannot be null")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Column(name = "password", nullable = false)
    private String password;

    // Role of the user (e.g., ADMIN, USER)
    @NotNull(message = "Role cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    // Display name of the user
    @Column(name = "display_name")
    private String display_name;

    // Profile picture URL of the user
    @Column(name = "profile_pic")
    private String profile_pic;

    // Default constructor
    public UserModels() {}

    // Parameterized constructor
    public UserModels(String firstname, String lastname, String email, String username, String password, Role role, String display_name, String profile_pic) {
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
        this.username = username;
        this.password = password;
        this.role = role;
        this.display_name = display_name;
        this.profile_pic = profile_pic;
    }

    // Getters and setters
    public long getUserId() {
        return user_id;
    }

    public void setUserId(long user_id) {
        this.user_id = user_id;
    }

    // First name of the user
    public String getFirstname() {
        return firstname;
    }

    public void setFirstname(String firstname) {
        this.firstname = firstname;
    }

    // Last name of the user
    public String getLastname() {
        return lastname;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    // Email address of the user
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    // Username for the user
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    // Password for the user
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    // Role of the user (e.g., ADMIN, USER)
    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    // Display name of the user
    public String getDisplay_name() {
        return display_name;
    }

    public void setDisplay_name(String display_name) {
        this.display_name = display_name;
    }

    // Profile picture URL of the user
    public String getProfile_pic() {
        return profile_pic;
    }

    public void setProfile_pic(String profile_pic) {
        this.profile_pic = profile_pic;
    }
}