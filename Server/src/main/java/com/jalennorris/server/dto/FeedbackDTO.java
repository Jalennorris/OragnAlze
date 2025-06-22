package com.jalennorris.server.dto;

import java.time.LocalDateTime;

public class FeedbackDTO {
    private Long id;
    private Long userId;
    private String feedbackText;
    private Integer rating;
    private LocalDateTime createdAt;

    public FeedbackDTO() {}

    public FeedbackDTO( Long userId, String feedbackText, Integer rating, LocalDateTime createdAt) {

        this.userId = userId;
        this.feedbackText = feedbackText;
        this.rating = rating;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFeedbackText() { return feedbackText; }
    public void setFeedbackText(String feedbackText) { this.feedbackText = feedbackText; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
