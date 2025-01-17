package com.jalennorris.server.Controllers;

import com.jalennorris.server.Models.ScheduleModels;
import com.jalennorris.server.service.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleControllers {

    private final ScheduleService scheduleService;

    @Autowired
    public ScheduleControllers(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    // Get all schedules asynchronously
    @GetMapping
    public ResponseEntity<List<ScheduleModels>> getSchedules() throws ExecutionException, InterruptedException {
        Future<List<ScheduleModels>> schedulesFuture = scheduleService.getAllSchedules();
        List<ScheduleModels> schedules = schedulesFuture.get();  // Wait for the async operation to complete
        return ResponseEntity.ok(schedules);
    }

    // Get a schedule by ID asynchronously
    @GetMapping("/{id}")
    public ResponseEntity<ScheduleModels> getSchedule(@PathVariable long id) throws ExecutionException, InterruptedException {
        Future<ScheduleModels> scheduleFuture = scheduleService.getScheduleById(id);
        ScheduleModels schedule = scheduleFuture.get();  // Wait for the async operation to complete
        return ResponseEntity.ok(schedule);
    }

    // Create a new schedule asynchronously
    @PostMapping
    public ResponseEntity<ScheduleModels> createSchedule(@RequestBody ScheduleModels newSchedule) throws ExecutionException, InterruptedException {
        Future<ScheduleModels> createdScheduleFuture = scheduleService.createSchedule(newSchedule);
        ScheduleModels createdSchedule = createdScheduleFuture.get();  // Wait for the async operation to complete
        return ResponseEntity.status(201).body(createdSchedule);
    }

    // Update a schedule by ID asynchronously
    @PutMapping("/{id}")
    public ResponseEntity<ScheduleModels> updateSchedule(@PathVariable long id, @RequestBody ScheduleModels updatedSchedule) throws ExecutionException, InterruptedException {
        Future<ScheduleModels> updatedScheduleFuture = scheduleService.updateSchedule(id, updatedSchedule);
        ScheduleModels updated = updatedScheduleFuture.get();  // Wait for the async operation to complete
        return ResponseEntity.ok(updated);
    }

    // Delete a schedule by ID asynchronously
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable long id) throws ExecutionException, InterruptedException {
        Future<Void> deleteFuture = scheduleService.deleteSchedule(id);
        deleteFuture.get();  // Wait for the async operation to complete
        return ResponseEntity.noContent().build();
    }
}