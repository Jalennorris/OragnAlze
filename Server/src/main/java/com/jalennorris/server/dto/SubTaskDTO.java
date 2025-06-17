package com.jalennorris.server.dto;

public class SubTaskDTO {
    private Long subtaskId;
    private String title;
    private String description;
    private boolean completed;
    private Long taskId;

    public SubTaskDTO() {}

    public SubTaskDTO(Long subtaskId, String title, String description, boolean completed, Long taskId) {
        this.subtaskId = subtaskId;
        this.title = title;
        this.description = description;
        this.completed = completed;
        this.taskId = taskId;
    }

    public Long getSubtaskId() {
        return subtaskId;
    }

    public void setSubtaskId(Long subtaskId) {
        this.subtaskId = subtaskId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }
}
