package com.jalennorris.server.service;

import com.jalennorris.server.Models.TasksModels;
import com.jalennorris.server.dto.TasksDTO;
import com.jalennorris.server.Repository.TasksRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

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
    public CompletableFuture<List<TasksDTO>> getAllTasks() {
        return CompletableFuture.supplyAsync(() -> tasksRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList()));
    }

    // Asynchronously fetch a task by its ID and cache the result
    @Async
    @Cacheable(value = "tasks", key = "#id")
    public CompletableFuture<TasksDTO> getTaskById(long id) {
        return CompletableFuture.supplyAsync(() -> {
            Optional<TasksModels> task = tasksRepository.findById(id);
            return task.map(this::convertToDTO).orElse(null);
        });
    }

    // Asynchronously create a new task and evict all cached entries
    @Async
    @CacheEvict(value = "tasks", allEntries = true)
    public CompletableFuture<TasksDTO> createTask(TasksModels task) {
        return CompletableFuture.supplyAsync(() -> {
            TasksModels savedTask = tasksRepository.save(task);
            return convertToDTO(savedTask);
        });
    }

    // Asynchronously update a task and evict the cache entry for the updated task
    @Async
    @CacheEvict(value = "tasks", key = "#id")
    public CompletableFuture<TasksDTO> updateTask(long id, TasksModels task) {
        return CompletableFuture.supplyAsync(() -> {
            Optional<TasksModels> existingTaskOptional = tasksRepository.findById(id);
            if (existingTaskOptional.isPresent()) {
                TasksModels existingTask = existingTaskOptional.get();
                existingTask.setTask_name(task.getTask_name()); // Keep snake_case as in TasksModels
                existingTask.setTask_description(task.getTask_description()); // Keep snake_case
                existingTask.setPriority(task.getPriority());
                existingTask.setEstimated_duration(task.getEstimated_duration()); // Keep snake_case
                existingTask.setDeadline(task.getDeadline());
                existingTask.setStatus(task.getStatus());
                existingTask.setCreated_at(task.getCreated_at()); // Keep snake_case
                TasksModels updatedTask = tasksRepository.save(existingTask);
                return convertToDTO(updatedTask);
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

    // Helper method to convert TasksModels to TasksDTO
    private TasksDTO convertToDTO(TasksModels task) {
        TasksDTO taskDTO = new TasksDTO();
        taskDTO.setTaskId(task.getTask_id()); // Map snake_case field to camelCase
        taskDTO.setTaskName(task.getTask_name()); // Map snake_case field to camelCase
        taskDTO.setTaskDescription(task.getTask_description()); // Map snake_case field to camelCase
        taskDTO.setPriority(task.getPriority());
        taskDTO.setEstimatedDuration(task.getEstimated_duration()); // Map snake_case field to camelCase
        taskDTO.setDeadline(task.getDeadline());
        taskDTO.setStatus(task.getStatus());
        taskDTO.setCreatedAt(task.getCreated_at()); // Map snake_case field to camelCase
        return taskDTO;
    }
}