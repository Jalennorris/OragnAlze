package com.jalennorris.server.dto;

import java.util.Date;

public class ScheduleDTO {

    private long scheduleId;
    private long userId;
    private long taskId;
    private Date scheduledTime;
    private String timeStamp;

    // Default constructor
    public ScheduleDTO() {}

    // Constructor with parameters
    public ScheduleDTO(long scheduleId, long userId, long taskId, Date scheduledTime, String timeStamp) {
        this.scheduleId = scheduleId;
        this.userId = userId;
        this.taskId = taskId;
        this.scheduledTime = scheduledTime;
        this.timeStamp = timeStamp;
    }

    // Getters and Setters
    public long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public long getUserId() {
        return userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
    }

    public long getTaskId() {
        return taskId;
    }

    public void setTaskId(long taskId) {
        this.taskId = taskId;
    }

    public Date getScheduledTime() {
        return scheduledTime;
    }

    public void setScheduledTime(Date scheduledTime) {
        this.scheduledTime = scheduledTime;
    }

    public String getTimeStamp() {
        return timeStamp;
    }

    public void setTimeStamp(String timeStamp) {
        this.timeStamp = timeStamp;
    }
}