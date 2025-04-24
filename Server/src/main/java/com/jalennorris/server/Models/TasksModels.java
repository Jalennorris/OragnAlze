package com.jalennorris.server.Models;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

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

    private ZonedDateTime deadline;

    private String status;

    private ZonedDateTime created_at;

    @Column(name = "completed" )
    private boolean completed;

    @Column(name = "category" )
    private String category;

    @Column(name = "notes")
    private String notes; // Field to store notes for the task

    // Default constructor (required for JPA)
    public TasksModels() {}

    public TasksModels(long task_id, long userId, String task_name, String task_description, String priority,
                       String estimated_duration, ZonedDateTime deadline, String status, boolean completed, String category ,ZonedDateTime created_at, String notes) {
        this.task_id = task_id;
        this.userId = userId;
        this.task_name = task_name;
        this.task_description = task_description;
        this.priority = priority;
        this.estimated_duration = estimated_duration;
        this.deadline = deadline;
        this.status = status;
        this.completed = completed;
        this.category = category;
        this.created_at = created_at;
        this.notes = notes;
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

    public ZonedDateTime getCreated_at() {
        return created_at;
    }

    public void setCreated_at(ZonedDateTime created_at) {
        this.created_at = created_at;
    }

    public long getUserId() {
        return userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

}