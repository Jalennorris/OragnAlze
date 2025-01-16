package com.jalennorris.server.service;

import com.jalennorris.server.Models.TasksModels;
import com.jalennorris.server.Repository.TasksRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TasksRepository tasksRepository;

    @Autowired
    public TaskService(TasksRepository tasksRepository) {
        this.tasksRepository = tasksRepository;
    }

    // Cache the result of all tasks (if it's a frequently requested method)
    @Cacheable(value = "tasks")
    public List<TasksModels> getAllTasks() {
        return tasksRepository.findAll();
    }

    // Cache by task id to optimize retrieval
    @Cacheable(value = "tasks", key = "#id")
    public TasksModels getTaskById(long id) {
        return tasksRepository.findById(id).orElse(null);
    }

    // Method to create a new task
    @CacheEvict(value = "tasks", allEntries = true)  // Evicts all cache entries when a new task is created
    public TasksModels createTask(TasksModels task) {
        return tasksRepository.save(task);
    }

    // Method to update a task
    @CacheEvict(value = "tasks", key = "#id") // Evict task cache for the given task id when updating
    public TasksModels updateTask(long id, TasksModels task) {
        TasksModels existingTask = tasksRepository.findById(id).orElse(null);
        if (existingTask != null) {
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
    }

    // Delete task by ID
    @CacheEvict(value = "tasks", key = "#id") // Evict the cache entry for the deleted task
    public boolean deleteTask(long id) {
        if (tasksRepository.existsById(id)) {
            tasksRepository.deleteById(id);
            return true;
        }
        return false;
    }
}

