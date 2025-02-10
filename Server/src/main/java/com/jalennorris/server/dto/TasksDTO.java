package com.jalennorris.server.dto;

import java.time.ZonedDateTime;
import java.io.Serializable;

public class TasksDTO implements Serializable {

    // When you are creating/testing use these instead of models
    private static final long serialVersionUID = 1L;

    private long taskId;
    private long userId;
    private String taskName;
    private String taskDescription;
    private String priority;
    private String estimatedDuration;
    private ZonedDateTime deadline;
    private String status;
    private boolean completed;
    private String category;
    private ZonedDateTime createdAt;

    // Default constructor
    public TasksDTO() {}

    // Constructor with parameters
    public TasksDTO(long taskId, long userId, String taskName, String taskDescription, String priority,
                    String estimatedDuration, ZonedDateTime deadline, String status, boolean completed, String category, ZonedDateTime createdAt) {
        this.taskId = taskId;
        this.userId = userId;
        this.taskName = taskName;
        this.taskDescription = taskDescription;
        this.priority = priority;
        this.estimatedDuration = estimatedDuration;
        this.deadline = deadline;
        this.status = status;
        this.completed = completed;
        this.category = category;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public long getTaskId() {
        return taskId;
    }

    public void setTaskId(long taskId) {
        this.taskId = taskId;
    }

    public long getUserId() {
        return userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
    }

    public String getTaskName() {
        return taskName;
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }

    public String getTaskDescription() {
        return taskDescription;
    }

    public void setTaskDescription(String taskDescription) {
        this.taskDescription = taskDescription;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getEstimatedDuration() {
        return estimatedDuration;
    }

    public void setEstimatedDuration(String estimatedDuration) {
        this.estimatedDuration = estimatedDuration;
    }

    public ZonedDateTime getDeadline() {
        return deadline;
    }

    public void setDeadline(ZonedDateTime deadline) {
        this.deadline = deadline;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}