package com.jalennorris.server.Models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_goals")
public class UserGoal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserModels user;

    @Column(name = "goal_text", nullable = false)
    private String goalText;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public UserGoal() {}

    public UserGoal(UserModels user, String goalText, LocalDateTime createdAt) {
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
