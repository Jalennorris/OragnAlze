package com.jalennorris.server.Controllers;

import com.jalennorris.server.dto.TasksDTO;
import com.jalennorris.server.Models.TasksModels;
import com.jalennorris.server.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/tasks")
public class TasksControllers {

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
        // Convert the incoming DTO to a TasksModels entity
        TasksModels taskEntity = new TasksModels();
        taskEntity.setTask_name(newTask.getTaskName()); // Mapping camelCase to snake_case
        taskEntity.setTask_description(newTask.getTaskDescription()); // Mapping camelCase to snake_case
        taskEntity.setPriority(newTask.getPriority());
        taskEntity.setEstimated_duration(newTask.getEstimatedDuration()); // Mapping camelCase to snake_case
        taskEntity.setDeadline(newTask.getDeadline());
        taskEntity.setStatus(newTask.getStatus());
        taskEntity.setCreated_at(newTask.getCreatedAt()); // Mapping camelCase to snake_case

        // Call service to save the task
        return taskService.createTask(taskEntity)
                .thenApply(task -> ResponseEntity.status(201).body(task)); // Return 201 Created
    }

    // Asynchronously update a task
    @PutMapping("/{id}")
    public CompletableFuture<ResponseEntity<TasksDTO>> updateTask(@PathVariable long id, @RequestBody TasksDTO updatedTask) {
        // Convert the incoming DTO to a TasksModels entity
        TasksModels taskEntity = new TasksModels();
        taskEntity.setTask_name(updatedTask.getTaskName()); // Mapping camelCase to snake_case
        taskEntity.setTask_description(updatedTask.getTaskDescription()); // Mapping camelCase to snake_case
        taskEntity.setPriority(updatedTask.getPriority());
        taskEntity.setEstimated_duration(updatedTask.getEstimatedDuration()); // Mapping camelCase to snake_case
        taskEntity.setDeadline(updatedTask.getDeadline());
        taskEntity.setStatus(updatedTask.getStatus());
        taskEntity.setCreated_at(updatedTask.getCreatedAt()); // Mapping camelCase to snake_case

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
}