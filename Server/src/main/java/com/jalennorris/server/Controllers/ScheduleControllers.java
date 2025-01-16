package com.jalennorris.server.Controllers;

import com.jalennorris.server.Models.ScheduleModels;
import com.jalennorris.server.service.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleControllers {

    private final ScheduleService scheduleService;

    @Autowired
    public ScheduleControllers(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    // Get all schedules
    @GetMapping
    public ResponseEntity<List<ScheduleModels>> getSchedules() {
        List<ScheduleModels> schedules = scheduleService.getAllSchedules();
        return ResponseEntity.ok(schedules);
    }

    // Get a schedule by ID
    @GetMapping("/{id}")
    public ResponseEntity<ScheduleModels> getSchedule(@PathVariable long id) {
        ScheduleModels schedule = scheduleService.getScheduleById(id);
        return ResponseEntity.ok(schedule);
    }

    // Create a new schedule
    @PostMapping
    public ResponseEntity<ScheduleModels> createSchedule(@RequestBody ScheduleModels newSchedule) {
        ScheduleModels createdSchedule = scheduleService.createSchedule(newSchedule);
        return ResponseEntity.status(201).body(createdSchedule);
    }

    // Update a schedule by ID
    @PutMapping("/{id}")
    public ResponseEntity<ScheduleModels> updateSchedule(@PathVariable long id, @RequestBody ScheduleModels updatedSchedule) {
        ScheduleModels updated = scheduleService.updateSchedule(id, updatedSchedule);
        return ResponseEntity.ok(updated);
    }

    // Delete a schedule by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable long id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.noContent().build();
    }
}