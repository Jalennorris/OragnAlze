package com.jalennorris.server.Models;
import java.util.Date;

import jakarta.persistence.*;

import javax.xml.crypto.Data;

@Entity
@Table(name = "schedule")
public class ScheduleModels {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long scheduleId;

    @Column(name = "user_id", nullable = false)
    private long userId;

    @Column(name = "task_id", nullable = false)
    private long taskId;

    private Date scheduled_time;

    @Column(name = "timestamp", nullable = false)
    private String timeStamp;

    // Default constructor
    public ScheduleModels() {
    }

    // Constructor with parameters
    public ScheduleModels( long scheduleId ,long userId, long taskId,Date scheduled_time, String timeStamp) {
        this.userId = userId;
        this.taskId = taskId;
        this.timeStamp = timeStamp;
        this.scheduled_time = scheduled_time;
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

    public Date getScheduled_time(){
        return scheduled_time;
    }
    public void setScheduled_time(Date scheduled_time){
        this.scheduled_time = scheduled_time;
    }

    public String getTimeStamp() {
        return timeStamp;
    }

    public void setTimeStamp(String timeStamp) {
        this.timeStamp = timeStamp;
    }
}