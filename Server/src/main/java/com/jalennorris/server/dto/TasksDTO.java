package com.jalennorris.server.dto;

public class TasksDTO {


    //when you are creating / testing use thses instead of models


    private long taskId;
    private long userId;
    private String taskName;
    private String taskDescription;
    private String priority;
    private String estimatedDuration;
    private String deadline;
    private String status;
    private String createdAt;

    // Default constructor
    public TasksDTO() {}

    // Constructor with parameters
    public TasksDTO(long taskId, long userId, String taskName, String taskDescription, String priority,
                    String estimatedDuration, String deadline, String status, String createdAt) {
        this.taskId = taskId;
        this.userId = userId;
        this.taskName = taskName;
        this.taskDescription = taskDescription;
        this.priority = priority;
        this.estimatedDuration = estimatedDuration;
        this.deadline = deadline;
        this.status = status;
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

    public String getDeadline() {
        return deadline;
    }

    public void setDeadline(String deadline) {
        this.deadline = deadline;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}