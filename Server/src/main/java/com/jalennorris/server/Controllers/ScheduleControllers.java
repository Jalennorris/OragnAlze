package com.jalennorris.server.Controllers;

import com.jalennorris.server.dto.ScheduleDTO;
import com.jalennorris.server.Models.ScheduleModels;
import com.jalennorris.server.service.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleControllers {

    private final ScheduleService scheduleService;

    @Autowired
    public ScheduleControllers(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    // Get all schedules asynchronously and return DTOs
    @GetMapping
    public CompletableFuture<ResponseEntity<List<ScheduleDTO>>> getSchedules() {
        return scheduleService.getAllSchedules()
                .thenApply(ResponseEntity::ok);
    }

    // Get a schedule by ID asynchronously and return DTO
    @GetMapping("/{id}")
    public CompletableFuture<ResponseEntity<ScheduleDTO>> getSchedule(@PathVariable long id) {
        return scheduleService.getScheduleById(id)
                .thenApply(ResponseEntity::ok);
    }

    // Create a new schedule asynchronously and return DTO
    @PostMapping
    public CompletableFuture<ResponseEntity<ScheduleDTO>> createSchedule(@RequestBody ScheduleDTO newScheduleDTO) {
        ScheduleModels newSchedule = new ScheduleModels(); // Convert DTO to model
        newSchedule.setUserId(newScheduleDTO.getUserId());
        newSchedule.setTaskId(newScheduleDTO.getTaskId());
        newSchedule.setScheduled_time(newScheduleDTO.getScheduledTime());
        newSchedule.setTimeStamp(newScheduleDTO.getTimeStamp());

        return scheduleService.createSchedule(newSchedule)
                .thenApply(createdSchedule -> ResponseEntity.status(201).body(createdSchedule));
    }

    // Update a schedule by ID asynchronously and return DTO
    @PutMapping("/{id}")
    public CompletableFuture<ResponseEntity<ScheduleDTO>> updateSchedule(@PathVariable long id,  @RequestBody ScheduleDTO updatedScheduleDTO) {
        ScheduleModels updatedSchedule = new ScheduleModels(); // Convert DTO to model
        updatedSchedule.setUserId(updatedScheduleDTO.getUserId());
        updatedSchedule.setTaskId(updatedScheduleDTO.getTaskId());
        updatedSchedule.setScheduled_time(updatedScheduleDTO.getScheduledTime());
        updatedSchedule.setTimeStamp(updatedScheduleDTO.getTimeStamp());

        return scheduleService.updateSchedule(id, updatedSchedule)
                .thenApply(ResponseEntity::ok);
    }

    // Delete a schedule by ID asynchronously
    @DeleteMapping("/{id}")
    public CompletableFuture<ResponseEntity<Void>> deleteSchedule(@PathVariable long id) {
        return scheduleService.deleteSchedule(id)
                .thenApply(aVoid -> ResponseEntity.noContent().build());
    }
}
