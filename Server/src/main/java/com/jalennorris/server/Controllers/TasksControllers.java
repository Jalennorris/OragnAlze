package com.jalennorris.server.Controllers;

import com.jalennorris.server.dto.TasksDTO;
import com.jalennorris.server.Models.TasksModels;
import com.jalennorris.server.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    @PutMapping("/{id}")
    public CompletableFuture<ResponseEntity<TasksDTO>> updateTask(@PathVariable long id, @RequestBody TasksDTO updatedTask) {
        TasksModels taskEntity = convertToEntity(updatedTask);
        validateTask(taskEntity); // Validate task before updating

        // Call service to update the task
        return taskService.updateTask(id, taskEntity)
                .thenApply(task -> {
                    if (task != null) {
                        return ResponseEntity.ok(task);
                    } else {
                        return ResponseEntity.notFound().build();
                    }
                });
    }

    // Asynchronously delete a task by ID
    @DeleteMapping("/{id}")
    public CompletableFuture<ResponseEntity<Void>> deleteTask(@PathVariable long id) {
        return taskService.deleteTask(id)
                .thenApply(success -> {
                    if (success) {
                        return ResponseEntity.noContent().build();
                    } else {
                        return ResponseEntity.notFound().build();
                    }
                });
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