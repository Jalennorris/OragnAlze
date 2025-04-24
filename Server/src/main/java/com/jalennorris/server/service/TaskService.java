package com.jalennorris.server.service;

import com.jalennorris.server.Models.TasksModels;
import com.jalennorris.server.dto.TasksDTO;
import com.jalennorris.server.Repository.TasksRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.util.Map;
import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;

@Service
public class TaskService {

    private final TasksRepository tasksRepository;
    private final StringRedisTemplate stringRedisTemplate;

    @Autowired
    public TaskService(TasksRepository tasksRepository, StringRedisTemplate stringRedisTemplate) {
        this.tasksRepository = tasksRepository;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Async
    @Cacheable(value = "tasks")
    public CompletableFuture<List<TasksDTO>> getAllTasks() {
        // Fetch all tasks from the database and convert them to DTOs
        return CompletableFuture.supplyAsync(() -> tasksRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList()));
    }

    @Async
    @Cacheable(value = "tasks", key = "#id")
    public CompletableFuture<TasksDTO> getTaskById(long id) {
        // Fetch a task by its ID and convert it to a DTO
        return CompletableFuture.supplyAsync(() -> {
            Optional<TasksModels> task = tasksRepository.findById(id);
            return task.map(this::convertToDTO).orElse(null);
        });
    }

    // getting all tasks by userId
    @Async
    public CompletableFuture<List<TasksDTO>> getTasksByUserId(long userId) {
        // Fetch all tasks for a specific user ID
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
        // Validate and save a new task, then convert it to a DTO
        return CompletableFuture.supplyAsync(() -> {
            validateTask(task);
            TasksModels savedTask = tasksRepository.save(task);
            return convertToDTO(savedTask);
        });
    }

    @Async
    @CacheEvict(value = "tasks", key = "#id")
    public CompletableFuture<TasksDTO> updateTask(long id, TasksModels task) {
        // Update an existing task by its ID
        return CompletableFuture.supplyAsync(() -> {
            Optional<TasksModels> existingTaskOptional = tasksRepository.findById(id);
            if (existingTaskOptional.isPresent()) {
                TasksModels existingTask = existingTaskOptional.get();
                // Update fields
                existingTask.setTask_name(task.getTask_name()); // Keep snake_case as in TasksModels
                existingTask.setTask_description(task.getTask_description()); // Keep snake_case
                existingTask.setPriority(task.getPriority());
                existingTask.setEstimated_duration(task.getEstimated_duration());
                existingTask.setCompleted(task.isCompleted());
                existingTask.setCategory(task.getCategory());
                existingTask.setDeadline(task.getDeadline());
                existingTask.setStatus(task.getStatus());
                existingTask.setCreated_at(task.getCreated_at()); // Keep snake_case
                existingTask.setNotes(task.getNotes()); // Add handling for notes
                validateTask(existingTask);
                TasksModels updatedTask = tasksRepository.save(existingTask);
                return convertToDTO(updatedTask);
            }
            return null;
        });
    }

    @Transactional
    @Async
    @CacheEvict(value = "tasks", key = "#id")
    public CompletableFuture<TasksDTO> updateTask(long id, Map<String, Object> task) {
        // Update specific fields of a task using a map of key-value pairs
        return CompletableFuture.supplyAsync(() -> {
            TasksModels existingTask = tasksRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Task not found"));

            task.forEach((key, value) -> {
                switch (key) {
                    case "taskName":
                        if (value instanceof String) {
                            existingTask.setTask_name((String) value);
                        } else {
                            throw new IllegalArgumentException("Invalid value for taskName");
                        }
                        break;

                    case "taskDescription":
                        if (value instanceof String) {
                            existingTask.setTask_description((String) value);
                        } else {
                            throw new IllegalArgumentException("Invalid value for taskDescription");
                        }
                        break;

                    case "priority":
                        if (value instanceof String) {
                            existingTask.setPriority((String) value);
                        } else {
                            throw new IllegalArgumentException("Invalid value for priority");
                        }
                        break;

                    case "estimatedDuration":
                        if (value instanceof String) {
                            existingTask.setEstimated_duration((String) value);
                        } else {
                            throw new IllegalArgumentException("Invalid value for estimatedDuration");
                        }
                        break;

                    case "deadline":
                        try {
                            existingTask.setDeadline(ZonedDateTime.parse((String) value));
                        } catch (Exception e) {
                            throw new IllegalArgumentException("Invalid value for deadline. Must be an ISO-8601 date-time string.", e);
                        }
                        break;

                    case "status":
                        if (value instanceof String) {
                            existingTask.setStatus((String) value);
                        } else {
                            throw new IllegalArgumentException("Invalid value for status");
                        }
                        break;

                    case "completed":
                        if (value instanceof String) {
                            existingTask.setCompleted(Boolean.parseBoolean((String) value));
                        } else if (value instanceof Boolean) {
                            existingTask.setCompleted((Boolean) value);
                        } else {
                            throw new IllegalArgumentException("Invalid value for completed");
                        }
                        break;

                    case "category":
                        if (value instanceof String) {
                            existingTask.setCategory((String) value);
                        } else {
                            throw new IllegalArgumentException("Invalid value for category");
                        }
                        break;

                    case "createdAt":
                        try {
                            existingTask.setCreated_at(ZonedDateTime.parse((String) value));
                        } catch (Exception e) {
                            throw new IllegalArgumentException("Invalid value for createdAt. Must be an ISO-8601 date-time string.", e);
                        }
                        break;

                    case "notes":
                        if (value instanceof String) {
                            existingTask.setNotes((String) value);
                        } else {
                            throw new IllegalArgumentException("Invalid value for notes");
                        }
                        break;

                    default:
                        throw new IllegalArgumentException("Invalid field: " + key);
                }
            });

            TasksModels updatedTask = tasksRepository.save(existingTask);
            return convertToDTO(updatedTask);
        });
    }

    @Async
    @CacheEvict(value = "tasks", key = "#id")
    public CompletableFuture<Boolean> deleteTask(long id) {
        // Delete a task by its ID and evict related cache entries
        return CompletableFuture.supplyAsync(() -> {
            Optional<TasksModels> taskOptional = tasksRepository.findById(id);
            if (taskOptional.isPresent()) {
                TasksModels task = taskOptional.get();
                long userId = task.getUser_id(); // Retrieve the userId of the task
                tasksRepository.deleteById(id);

                // Explicitly evict cache for getTasksByUserId and all tasks
                evictCache("tasks::" + userId); // Evict cache for getTasksByUserId
                evictCache("tasks"); // Evict cache for all tasks

                // Refresh the cache for getTasksByUserId to ensure no stale data
                refreshTasksByUserIdCache(userId);

                return true;
            }
            return false;
        });
    }

    // Helper method to evict cache entries
    private void evictCache(String cacheKey) {
        stringRedisTemplate.convertAndSend("cacheEvictChannel", cacheKey);
        stringRedisTemplate.delete(cacheKey); // Ensure the cache entry is deleted
    }

    // Helper method to refresh cache for tasks by user ID
    private void refreshTasksByUserIdCache(long userId) {
        CompletableFuture.runAsync(() -> {
            List<TasksModels> tasks = tasksRepository.findByUserId(userId);
            List<TasksDTO> tasksDTOs = tasks.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            stringRedisTemplate.opsForValue().set("tasks::" + userId, tasksDTOs.toString());
        });
    }

    private void validateTask(TasksModels task) {
        // Validate that the task has a non-empty name
        if (task.getTask_name() == null || task.getTask_name().isEmpty()) {
            throw new IllegalArgumentException("Task name must not be null or empty");
        }
    }

    private TasksDTO convertToDTO(TasksModels task) {
        // Convert a task entity to a DTO
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
        taskDTO.setNotes(task.getNotes()); // Map notes field
        return taskDTO;
    }

    private TasksModels convertToEntity(TasksDTO taskDTO) {
        TasksModels taskEntity = new TasksModels();
        taskEntity.setTask_id(taskDTO.getTaskId()); // Map camelCase field to snake_case
        taskEntity.setUser_id(taskDTO.getUserId());
        taskEntity.setTask_name(taskDTO.getTaskName()); // Map camelCase field to snake_case
        taskEntity.setTask_description(taskDTO.getTaskDescription()); // Map camelCase field to snake_case
        taskEntity.setPriority(taskDTO.getPriority());
        taskEntity.setEstimated_duration(taskDTO.getEstimatedDuration()); // Map camelCase field to snake_case
        taskEntity.setDeadline(taskDTO.getDeadline());
        taskEntity.setCompleted(taskDTO.isCompleted());
        taskEntity.setCategory(taskDTO.getCategory());
        taskEntity.setStatus(taskDTO.getStatus());
        taskEntity.setCreated_at(taskDTO.getCreatedAt()); // Map camelCase field to snake_case
        taskEntity.setNotes(taskDTO.getNotes()); // Map notes field
        return taskEntity;
    }
}
