package com.jalennorris.server.dto;

import java.time.LocalDateTime;
import com.jalennorris.server.Models.UserModels;

public class UserGoalDTO {
    private Long id;
    private UserModels user;
    private String goalText;
    private LocalDateTime createdAt;

    public UserGoalDTO() {}

    public UserGoalDTO(Long id, UserModels user, String goalText, LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
        this.goalText = goalText;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UserModels getUser() { return user; }
    public void setUser(UserModels user) { this.user = user; }

    public String getGoalText() { return goalText; }
    public void setGoalText(String goalText) { this.goalText = goalText; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
