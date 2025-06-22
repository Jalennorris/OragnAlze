package com.jalennorris.server.Models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.jalennorris.server.dto.UserGoalDTO;

@Entity
@Table(name = "user_goals")
public class UserGoal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long user;

    @Column(name = "goal_text", nullable = false)
    private String goalText;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public UserGoal() {}

    public UserGoal(Long id, Long user, String goalText, LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
        this.goalText = goalText;
        this.createdAt = createdAt;
    }

    public UserGoal(Long user, String goalText, LocalDateTime createdAt) {
        this.user = user;
        this.goalText = goalText;
        this.createdAt = createdAt;
    }

    // Convert Entity to DTO
    public UserGoalDTO toDTO() {
        return new UserGoalDTO(
            this.id,
            this.user,
            this.goalText,
            this.createdAt
        );
    }

    // Create Entity from DTO
    public static UserGoal fromDTO(UserGoalDTO dto) {
        return new UserGoal(
            dto.getId(),
            dto.getUser(),
            dto.getGoalText(),
            dto.getCreatedAt()
        );
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUser() { return user; }
    public void setUser(Long user) { this.user = user; }

    public String getGoalText() { return goalText; }
    public void setGoalText(String goalText) { this.goalText = goalText; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
