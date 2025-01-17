package com.jalennorris.server.service;

import com.jalennorris.server.Models.TasksModels;
import com.jalennorris.server.Repository.TasksRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Service
public class TaskService {

    private final TasksRepository tasksRepository;

    @Autowired
    public TaskService(TasksRepository tasksRepository) {
        this.tasksRepository = tasksRepository;
    }

    // Asynchronously fetch all tasks and cache the result
    @Async
    @Cacheable(value = "tasks")
    public CompletableFuture<List<TasksModels>> getAllTasks() {
        return CompletableFuture.supplyAsync(tasksRepository::findAll);
    }

    // Asynchronously fetch a task by its ID and cache the result
    @Async
    @Cacheable(value = "tasks", key = "#id")
    public CompletableFuture<TasksModels> getTaskById(long id) {
        return CompletableFuture.supplyAsync(() -> tasksRepository.findById(id).orElse(null));
    }

    // Asynchronously create a new task and evict all cached entries
    @Async
    @CacheEvict(value = "tasks", allEntries = true)
    public CompletableFuture<TasksModels> createTask(TasksModels task) {
        return CompletableFuture.supplyAsync(() -> tasksRepository.save(task));
    }

    // Asynchronously update a task and evict the cache entry for the updated task
    @Async
    @CacheEvict(value = "tasks", key = "#id")
    public CompletableFuture<TasksModels> updateTask(long id, TasksModels task) {
        return CompletableFuture.supplyAsync(() -> {
            Optional<TasksModels> existingTaskOptional = tasksRepository.findById(id);
            if (existingTaskOptional.isPresent()) {
                TasksModels existingTask = existingTaskOptional.get();
                existingTask.setTask_name(task.getTask_name());
                existingTask.setTask_description(task.getTask_description());
                existingTask.setPriority(task.getPriority());
                existingTask.setEstimated_duration(task.getEstimated_duration());
                existingTask.setDeadline(task.getDeadline());
                existingTask.setStatus(task.getStatus());
                existingTask.setCreated_at(task.getCreated_at());
                return tasksRepository.save(existingTask);
            }
            return null;
        });
    }

    // Asynchronously delete a task by ID and evict the cache entry for the deleted task
    @Async
    @CacheEvict(value = "tasks", key = "#id")
    public CompletableFuture<Boolean> deleteTask(long id) {
        return CompletableFuture.supplyAsync(() -> {
            if (tasksRepository.existsById(id)) {
                tasksRepository.deleteById(id);
                return true;
            }
            return false;
        });
    }
}
