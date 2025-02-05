package com.jalennorris.server.Models;

import jakarta.persistence.*;

@Entity
@Table(name = "tasks") // Ensure this matches your database table name
public class TasksModels {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Automatically generate the task_id
    private long task_id;

    private long userId;
    @Column(name="task_name")
    private String task_name;

    private String task_description;

    private String priority;

    private String estimated_duration;

    private String deadline;

    private String status;

    private String created_at;

    // Default constructor (required for JPA)
    public TasksModels() {}

    public TasksModels(long task_id, long userId, String task_name, String task_description, String priority,
                       String estimated_duration, String deadline, String status, String created_at) {
        this.task_id = task_id;
        this.userId = userId;
        this.task_name = task_name;
        this.task_description = task_description;
        this.priority = priority;
        this.estimated_duration = estimated_duration;
        this.deadline = deadline;
        this.status = status;
        this.created_at = created_at;
    }

    public long getTask_id() {
        return task_id;
    }

    public void setTask_id(long task_id) {
        this.task_id = task_id;
    }

    public long getUser_id() {
        return userId;
    }

    public void setUser_id(long userId) {
        this.userId = userId;
    }

    public String getTask_name() {
        return task_name;
    }

    public void setTask_name(String task_name) {
        this.task_name = task_name;
    }

    public String getTask_description() {
        return task_description;
    }

    public void setTask_description(String task_description) {
        this.task_description = task_description;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getEstimated_duration() {
        return estimated_duration;
    }

    public void setEstimated_duration(String estimated_duration) {
        this.estimated_duration = estimated_duration;
    }

    public String getDeadline() { // Changed from int to String for consistency with the class definition
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

    public String getCreated_at() {
        return created_at;
    }

    public void setCreated_at(String created_at) {
        this.created_at = created_at;
    }
}