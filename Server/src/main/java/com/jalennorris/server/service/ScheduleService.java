package com.jalennorris.server.service;

import com.jalennorris.server.Models.ScheduleModels;
import com.jalennorris.server.Repository.ScheduleRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;

    public ScheduleService(ScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

    // Get all schedules and cache the result
    @Cacheable(value = "schedules")
    public List<ScheduleModels> getAllSchedules() {
        return scheduleRepository.findAll();
    }

    // Get a schedule by ID and cache the result by ID
    @Cacheable(value = "schedules", key = "#id")
    public ScheduleModels getScheduleById(long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found with ID: " + id));
    }

    // Create a new schedule and evict the cache
    @CacheEvict(value = "schedules", allEntries = true)  // Evicts all cache entries when a new schedule is created
    public ScheduleModels createSchedule(ScheduleModels newSchedule) {
        return scheduleRepository.save(newSchedule);
    }

    // Update a schedule by ID and evict the cache for that schedule
    @CacheEvict(value = "schedules", key = "#id")  // Evicts the cache for the specific schedule being updated
    public ScheduleModels updateSchedule(long id, ScheduleModels updatedSchedule) {
        ScheduleModels existingSchedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found with ID: " + id));

        existingSchedule.setUserId(updatedSchedule.getUserId());
        existingSchedule.setTaskId(updatedSchedule.getTaskId());
        existingSchedule.setTimeStamp(updatedSchedule.getTimeStamp());
        existingSchedule.setScheduled_time(updatedSchedule.getScheduled_time());

        return scheduleRepository.save(existingSchedule);
    }

    // Delete a schedule by ID and evict the cache for that schedule
    @CacheEvict(value = "schedules", key = "#id")  // Evicts the cache for the specific schedule being deleted
    public void deleteSchedule(long id) {
        if (!scheduleRepository.existsById(id)) {
            throw new RuntimeException("Schedule not found with ID: " + id);
        }
        scheduleRepository.deleteById(id);
    }
}