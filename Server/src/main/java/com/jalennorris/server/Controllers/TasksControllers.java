package com.jalennorris.server.Controllers;

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
    public CompletableFuture<ResponseEntity<List<TasksModels>>> getTasks() {
        return taskService.getAllTasks()
                .thenApply(ResponseEntity::ok); // Return tasks wrapped in ResponseEntity
    }

    // Asynchronously fetch a task by ID
    @GetMapping("/{id}")
    public CompletableFuture<ResponseEntity<TasksModels>> getTask(@PathVariable("id") long id) {
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
    public CompletableFuture<ResponseEntity<TasksModels>> createTask(@RequestBody TasksModels newTask) {
        return taskService.createTask(newTask)
                .thenApply(task -> ResponseEntity.status(201).body(task)); // Return 201 Created
    }

    // Asynchronously update a task
    @PutMapping("/{id}")
    public CompletableFuture<ResponseEntity<TasksModels>> updateTask(@PathVariable long id, @RequestBody TasksModels updatedTask) {
        return taskService.updateTask(id, updatedTask)
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