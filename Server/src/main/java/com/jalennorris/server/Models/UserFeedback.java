package com.jalennorris.server.Models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_feedback")
public class UserFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long user;

    @Column(name = "feedback_text")
    private String feedbackText;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "accepted_ai_task_id")
    private Long acceptedAITaskId;

    public UserFeedback() {}

    public UserFeedback(Long id, Long user, String feedbackText, Integer rating, LocalDateTime createdAt, Long acceptedAITaskId) {
        this.id = id;
        this.user = user;
        this.feedbackText = feedbackText;
        this.rating = rating;
        this.createdAt = createdAt;
        this.acceptedAITaskId = acceptedAITaskId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUser() { return user; }
    public void setUser(Long user) { this.user = user; }

    public String getFeedbackText() { return feedbackText; }
    public void setFeedbackText(String feedbackText) { this.feedbackText = feedbackText; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getAcceptedAITaskId() { return acceptedAITaskId; }
    public void setAcceptedAITaskId(Long acceptedAITaskId) { this.acceptedAITaskId = acceptedAITaskId; }
}
