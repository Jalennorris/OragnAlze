package com.jalennorris.server.Models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.OffsetDateTime;

@Entity
@Table(name = "accepted_tasks")
public class AcceptedTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // No JPA association, just a user ID
    @Column(name = "user_id", nullable = false)
    private Long user;

    @Column(name = "task_title", nullable = false)
    private String taskTitle;

    @Column(name = "task_description")
    private String taskDescription;

    @Column(name = "deadline")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private OffsetDateTime deadline;

    @Column(name = "accepted_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private OffsetDateTime acceptedAt;

    public AcceptedTask() {}

    public AcceptedTask(Long user, String taskTitle, String taskDescription, OffsetDateTime deadline, OffsetDateTime acceptedAt) {
        this.user = user;
        this.taskTitle = taskTitle;
        this.taskDescription = taskDescription;
        this.deadline = deadline;
        this.acceptedAt = acceptedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUser() { return user; }
    public void setUser(Long user) { this.user = user; }

    public String getTaskTitle() { return taskTitle; }
    public void setTaskTitle(String taskTitle) { this.taskTitle = taskTitle; }

    public String getTaskDescription() { return taskDescription; }
    public void setTaskDescription(String taskDescription) { this.taskDescription = taskDescription; }

    public OffsetDateTime getDeadline() { return deadline; }
    public void setDeadline(OffsetDateTime deadline) { this.deadline = deadline; }

    public OffsetDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(OffsetDateTime acceptedAt) { this.acceptedAt = acceptedAt; }
}
