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

    @Async
    @Cacheable(value = "tasks")
    public CompletableFuture<List<TasksDTO>> getAllTasks() {
        return CompletableFuture.supplyAsync(() -> tasksRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList()));
    }

    @Async
    @Cacheable(value = "tasks", key = "#id")
    public CompletableFuture<TasksDTO> getTaskById(long id) {
        return CompletableFuture.supplyAsync(() -> {
            Optional<TasksModels> task = tasksRepository.findById(id);
            return task.map(this::convertToDTO).orElse(null);
        });
    }

    // getting all tasks by userId
    @Async
    @Cacheable(value = "tasks", key = "#userId")
    public CompletableFuture<List<TasksDTO>> getTasksByUserId(long userId) {
        return CompletableFuture.supplyAsync(() -> {
            List<TasksModels> tasks = tasksRepository.findByUserId(userId);
            return tasks.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        });
    }

    @Async
    @CacheEvict(value = "tasks", allEntries = true)
    public CompletableFuture<TasksDTO> createTask(TasksModels task) {
        return CompletableFuture.supplyAsync(() -> {
            validateTask(task);
            TasksModels savedTask = tasksRepository.save(task);
            return convertToDTO(savedTask);
        });
    }

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
                existingTask.setEstimated_duration(task.getEstimated_duration());
                existingTask.setCompleted(task.isCompleted());
                existingTask.setCategory(task.getCategory());
                // Keep snake_case
                existingTask.setDeadline(task.getDeadline());
                existingTask.setStatus(task.getStatus());

                existingTask.setCreated_at(task.getCreated_at()); // Keep snake_case
                validateTask(existingTask);
                TasksModels updatedTask = tasksRepository.save(existingTask);
                return convertToDTO(updatedTask);
            }
            return null;
        });
    }

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

    private void validateTask(TasksModels task) {
        if (task.getTask_name() == null || task.getTask_name().isEmpty()) {
            throw new IllegalArgumentException("Task name must not be null or empty");
        }
    }

    private TasksDTO convertToDTO(TasksModels task) {
        TasksDTO taskDTO = new TasksDTO();
        taskDTO.setTaskId(task.getTask_id()); // Map snake_case field to camelCase
        taskDTO.setUserId(task.getUser_id());
        taskDTO.setTaskName(task.getTask_name()); // Map snake_case field to camelCase
        taskDTO.setTaskDescription(task.getTask_description()); // Map snake_case field to camelCase
        taskDTO.setPriority(task.getPriority());
        taskDTO.setEstimatedDuration(task.getEstimated_duration()); // Map snake_case field to camelCase
        taskDTO.setDeadline(task.getDeadline());
        taskDTO.setCompleted(task.isCompleted());
        taskDTO.setCategory(task.getCategory());
        taskDTO.setStatus(task.getStatus());
        taskDTO.setCreatedAt(task.getCreated_at()); // Map snake_case field to camelCase
        return taskDTO;
    }
}
