package com.jalennorris.server.Controllers;

import com.jalennorris.server.dto.TasksDTO;
import com.jalennorris.server.Models.TasksModels;
import com.jalennorris.server.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@CrossOrigin(origins = {"http://localhost:8081"})
@RestController
@RequestMapping("/api/tasks")
public class TasksControllers {
    private static final Logger logger = LoggerFactory.getLogger(TasksControllers.class);

    private final TaskService taskService;

    @Autowired
    public TasksControllers(TaskService taskService) {
        this.taskService = taskService;
    }

    // Asynchronously fetch all tasks
    @GetMapping
    public CompletableFuture<ResponseEntity<List<TasksDTO>>> getTasks() {
        return taskService.getAllTasks()
                .thenApply(ResponseEntity::ok); // Return tasks wrapped in ResponseEntity
    }

    // Asynchronously fetch a task by ID
    @GetMapping("/{id}")
    public CompletableFuture<ResponseEntity<TasksDTO>> getTask(@PathVariable("id") long id) {
        return taskService.getTaskById(id)
                .thenApply(task -> {
                    if (task != null) {
                        return ResponseEntity.ok(task);
                    } else {
                        return ResponseEntity.notFound().build();
                    }
                });
    }
    //fetching all tasks by user Id

    @GetMapping("/user/{userId}")
    public CompletableFuture<ResponseEntity<List<TasksDTO>>> getTasksByUserId(@PathVariable("userId") long userId) {
        logger.info("Fetching tasks for userId: {}", userId);
        return taskService.getTasksByUserId(userId)
                .thenApply(tasks -> {
                    if (tasks != null && !tasks.isEmpty()) {
                        logger.info("Found {} tasks for userId: {}", tasks.size(), userId);
                        return ResponseEntity.ok(tasks);
                    } else {
                        logger.warn("No tasks found for userId: {}", userId);
                        return ResponseEntity.notFound().build();
                    }
                });
    }

    // Fetch tasks by status


    // Asynchronously create a new task
    @PostMapping
    public CompletableFuture<ResponseEntity<TasksDTO>> createTask(@RequestBody TasksDTO newTask) {
        try {
            TasksModels taskEntity = convertToEntity(newTask);
            validateTask(taskEntity); // Validate task before saving

            // Call service to save the task
            return taskService.createTask(taskEntity)
                    .thenApply(task -> ResponseEntity.status(201).body(task)); // Return 201 Created
        } catch (IllegalArgumentException e) {
            logger.error("Validation failed: {}", e.getMessage());
            return CompletableFuture.completedFuture(ResponseEntity.badRequest().body(null));
        } catch (Exception e) {
            logger.error("Failed to create task: {}", e.getMessage());
            return CompletableFuture.completedFuture(ResponseEntity.status(500).body(null));
        }
    }

    // Asynchronously update a task
    @PatchMapping("/{id}")
    public CompletableFuture<ResponseEntity<TasksDTO>> updateTask(@PathVariable long id, @RequestBody Map<String, Object> updatedTask) {
        return taskService.updateTask(id, updatedTask)
                .thenApply(updated -> updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build());
    }

    // Asynchronously delete a task by ID
    @DeleteMapping("/{id}")
    public CompletableFuture<ResponseEntity<Void>> deleteTask(@PathVariable long id) {
        try {
            return taskService.deleteTask(id)
                    .thenApply(success -> {
                        if (success) {
                            return ResponseEntity.noContent().build();
                        } else {
                            return ResponseEntity.notFound().build();
                        }
                    });
        } catch (Exception e) {
            logger.error("Failed to delete task with ID {}: {}", id, e.getMessage());
            return CompletableFuture.completedFuture(ResponseEntity.status(500).build());
        }
    }

    // Helper method to convert DTO to entity
    private TasksModels convertToEntity(TasksDTO taskDTO) {
        TasksModels taskEntity = new TasksModels();
        taskEntity.setUser_id(taskDTO.getUserId());
        taskEntity.setTask_name(taskDTO.getTaskName()); // Mapping camelCase to snake_case
        taskEntity.setTask_description(taskDTO.getTaskDescription()); // Mapping camelCase to snake_case
        taskEntity.setPriority(taskDTO.getPriority());
        taskEntity.setEstimated_duration(taskDTO.getEstimatedDuration()); // Mapping camelCase to snake_case
        taskEntity.setDeadline(taskDTO.getDeadline());
        taskEntity.setStatus(taskDTO.getStatus());
        taskEntity.setCompleted(taskDTO.isCompleted());
        taskEntity.setCategory(taskDTO.getCategory());
        taskEntity.setCreated_at(taskDTO.getCreatedAt()); // Mapping camelCase to snake_case
        return taskEntity;
    }

    // Helper method to validate task entity
    private void validateTask(TasksModels task) {
        if (task.getTask_name() == null || task.getTask_name().isEmpty()) {
            throw new IllegalArgumentException("Task name must not be null or empty");
        }
    }
}