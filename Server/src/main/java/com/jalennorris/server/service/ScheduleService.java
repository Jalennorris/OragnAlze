package com.jalennorris.server.service;

import com.jalennorris.server.Models.ScheduleModels;
import com.jalennorris.server.Repository.ScheduleRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;

    public ScheduleService(ScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

    // Get all schedules asynchronously and cache the result
    @Async
    @Cacheable(value = "schedules")
    public CompletableFuture<List<ScheduleModels>> getAllSchedules() {
        return CompletableFuture.completedFuture(scheduleRepository.findAll());
    }

    // Get a schedule by ID asynchronously and cache the result
    @Async
    @Cacheable(value = "schedules", key = "#id")
    public CompletableFuture<ScheduleModels> getScheduleById(long id) {
        return CompletableFuture.supplyAsync(() -> scheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found with ID: " + id)));
    }

    // Create a new schedule asynchronously and evict the entire cache
    @Async
    @CacheEvict(value = "schedules", allEntries = true)
    public CompletableFuture<ScheduleModels> createSchedule(ScheduleModels newSchedule) {
        return CompletableFuture.completedFuture(scheduleRepository.save(newSchedule));
    }

    // Update a schedule by ID asynchronously and evict the cache for that schedule
    @Async
    @CacheEvict(value = "schedules", key = "#id")
    public CompletableFuture<ScheduleModels> updateSchedule(long id, ScheduleModels updatedSchedule) {
        return CompletableFuture.supplyAsync(() -> scheduleRepository.findById(id)
                .map(existingSchedule -> {
                    existingSchedule.setUserId(updatedSchedule.getUserId());
                    existingSchedule.setTaskId(updatedSchedule.getTaskId());
                    existingSchedule.setTimeStamp(updatedSchedule.getTimeStamp());
                    existingSchedule.setScheduled_time(updatedSchedule.getScheduled_time());
                    return scheduleRepository.save(existingSchedule);
                })
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found with ID: " + id)));
    }

    // Delete a schedule by ID asynchronously and evict the cache for that schedule
    @Async
    @CacheEvict(value = "schedules", key = "#id")
    public CompletableFuture<Void> deleteSchedule(long id) {
        return CompletableFuture.runAsync(() -> {
            if (!scheduleRepository.existsById(id)) {
                throw new IllegalArgumentException("Schedule not found with ID: " + id);
            }
            scheduleRepository.deleteById(id);
        });
    }
}