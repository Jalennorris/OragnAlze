package com.jalennorris.server.service;

import com.jalennorris.server.Models.ScheduleModels;
import com.jalennorris.server.dto.ScheduleDTO;
import com.jalennorris.server.Repository.ScheduleRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;

    public ScheduleService(ScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

    // Convert ScheduleModels to ScheduleDTO
    private ScheduleDTO convertToDTO(ScheduleModels schedule) {
        return new ScheduleDTO(
                schedule.getScheduleId(),
                schedule.getUserId(),
                schedule.getTaskId(),
                schedule.getScheduled_time(),
                schedule.getTimeStamp()
        );
    }

    // Convert List of ScheduleModels to List of ScheduleDTOs
    private List<ScheduleDTO> convertToDTOList(List<ScheduleModels> schedules) {
        return schedules.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get all schedules asynchronously and return a List of ScheduleDTO
    @Async
    @Cacheable(value = "schedules")
    public CompletableFuture<List<ScheduleDTO>> getAllSchedules() {
        List<ScheduleModels> schedules = scheduleRepository.findAll();
        List<ScheduleDTO> scheduleDTOs = convertToDTOList(schedules);
        return CompletableFuture.completedFuture(scheduleDTOs);
    }

    // Get a schedule by ID asynchronously and return a ScheduleDTO
    @Async
    @Cacheable(value = "schedules", key = "#id")
    public CompletableFuture<ScheduleDTO> getScheduleById(long id) {
        ScheduleModels schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found with ID: " + id));
        ScheduleDTO scheduleDTO = convertToDTO(schedule);
        return CompletableFuture.completedFuture(scheduleDTO);
    }

    // Create a new schedule asynchronously and return a ScheduleDTO
    @Async
    @CacheEvict(value = "schedules", allEntries = true)
    public CompletableFuture<ScheduleDTO> createSchedule(ScheduleModels newSchedule) {
        ScheduleModels createdSchedule = scheduleRepository.save(newSchedule);
        ScheduleDTO scheduleDTO = convertToDTO(createdSchedule);
        return CompletableFuture.completedFuture(scheduleDTO);
    }

    // Update a schedule by ID asynchronously and return a ScheduleDTO
    @Async
    @CacheEvict(value = "schedules", key = "#id")
    public CompletableFuture<ScheduleDTO> updateSchedule(long id, ScheduleModels updatedSchedule) {
        return CompletableFuture.supplyAsync(() -> {
            ScheduleModels existingSchedule = scheduleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Schedule not found with ID: " + id));
            existingSchedule.setUserId(updatedSchedule.getUserId());
            existingSchedule.setTaskId(updatedSchedule.getTaskId());
            existingSchedule.setTimeStamp(updatedSchedule.getTimeStamp());
            existingSchedule.setScheduled_time(updatedSchedule.getScheduled_time());
            scheduleRepository.save(existingSchedule);
            return convertToDTO(existingSchedule);
        });
    }

    // Delete a schedule by ID asynchronously
    @Async
    @CacheEvict(value = "schedules", key = "#id")
    public CompletableFuture<Void> deleteSchedule(long id) {
        return CompletableFuture.runAsync(() -> {
            if (!scheduleRepository.existsById(id)) {
                throw new RuntimeException("Schedule not found with ID: " + id);
            }
            scheduleRepository.deleteById(id);
        });
    }
}