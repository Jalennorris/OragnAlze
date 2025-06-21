package com.jalennorris.server.dto;

import com.jalennorris.server.Models.UserModels;

import java.time.LocalDateTime;

public class AcceptedDTO {
    private Long id;
    private UserModels user;
    private String taskTitle;
    private String taskDescription;
    private LocalDateTime deadline;
    private LocalDateTime acceptedAt;

    public AcceptedDTO() {}

    public AcceptedDTO(UserModels user, String taskTitle, String taskDescription, LocalDateTime deadline, LocalDateTime acceptedAt) {
        this.user = user;
        this.taskTitle = taskTitle;
        this.taskDescription = taskDescription;
        this.deadline = deadline;
        this.acceptedAt = acceptedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UserModels getUser() { return user; }
    public void setUser(UserModels user) { this.user = user; }

    public String getTaskTitle() { return taskTitle; }
    public void setTaskTitle(String taskTitle) { this.taskTitle = taskTitle; }

    public String getTaskDescription() { return taskDescription; }
    public void setTaskDescription(String taskDescription) { this.taskDescription = taskDescription; }

    public LocalDateTime getDeadline() { return deadline; }
    public void setDeadline(LocalDateTime deadline) { this.deadline = deadline; }

    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }
}
