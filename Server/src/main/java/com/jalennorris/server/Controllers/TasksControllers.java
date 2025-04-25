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

    // Endpoint to fetch all tasks asynchronously
    @GetMapping
    public CompletableFuture<ResponseEntity<List<TasksDTO>>> getTasks() {
        return taskService.getAllTasks()
                .thenApply(ResponseEntity::ok); // Return tasks wrapped in ResponseEntity
    }

    // Endpoint to fetch a task by its ID
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
    // Endpoint to fetch all tasks for a specific user ID
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

    // Endpoint to fetch tasks by status


    // Endpoint to create a new task
    @PostMapping
    public CompletableFuture<ResponseEntity<TasksDTO>> createTask(@RequestBody TasksDTO newTask) {
        logger.info("Received POST request to create a task: {}", newTask); // Log incoming request
        try {
            TasksModels taskEntity = convertToEntity(newTask);
            validateTask(taskEntity); // Validate task before saving

            // Call service to save the task
            return taskService.createTask(taskEntity)
                    .thenApply(task -> {
                        logger.info("Task created successfully with ID: {}", task.getTaskId());
                        return ResponseEntity.status(201).body(task); // Return 201 Created
                    });
        } catch (IllegalArgumentException e) {
            logger.error("Validation failed: {}", e.getMessage());
            return CompletableFuture.completedFuture(ResponseEntity.badRequest().body(null));
        } catch (Exception e) {
            logger.error("Failed to create task: {}", e.getMessage());
            return CompletableFuture.completedFuture(ResponseEntity.status(500).body(null));
        }
    }

    // Endpoint to update a task partially
    @PatchMapping("/{id}")
    public CompletableFuture<ResponseEntity<TasksDTO>> updateTask(@PathVariable long id, @RequestBody Map<String, Object> updatedTask) {
        return taskService.updateTask(id, updatedTask)
                .thenApply(updated -> updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build());
    }

    // Endpoint to delete a task by its ID
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

    // Handle unsupported HTTP methods
    @RequestMapping(method = {RequestMethod.PUT, RequestMethod.HEAD, RequestMethod.OPTIONS, RequestMethod.TRACE})
    public ResponseEntity<Void> handleUnsupportedMethods() {
        logger.warn("Unsupported HTTP method received");
        return ResponseEntity.status(405).build(); // Return 405 Method Not Allowed
    }

    // Helper method to convert a DTO to an entity
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
        taskEntity.setNotes(taskDTO.getNotes() != null && !taskDTO.getNotes().isBlank() ? taskDTO.getNotes().trim() : null); // Handle null/blank notes
        return taskEntity;
    }

    // Helper method to validate a task entity
    private void validateTask(TasksModels task) {
        if (task.getTask_name() == null || task.getTask_name().isEmpty()) {
            throw new IllegalArgumentException("Task name must not be null or empty");
        }
        if (task.getNotes() != null && task.getNotes().length() > 500) { // Validate notes length
            throw new IllegalArgumentException("Notes must not exceed 500 characters");
        }
    }
}