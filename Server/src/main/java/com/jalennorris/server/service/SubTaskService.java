package com.jalennorris.server.service;

import com.jalennorris.server.Models.SubTaskModels;
import com.jalennorris.server.repository.SubTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SubTaskService {

    private final SubTaskRepository subTaskRepository;

    @Autowired
    public SubTaskService(SubTaskRepository subTaskRepository) {
        this.subTaskRepository = subTaskRepository;
    }

    public List<SubTaskModels> getSubTasksByTaskId(Long taskId) {
        return subTaskRepository.findByTaskId(taskId);
    }

    public Optional<SubTaskModels> getSubTaskById(Long id) {
        return subTaskRepository.findById(id);
    }

    public SubTaskModels saveSubTask(SubTaskModels subTask) {
        return subTaskRepository.save(subTask);
    }

    public void deleteSubTask(Long id) {
        subTaskRepository.deleteById(id);
    }

    public SubTaskModels updateSubTask(Long id, SubTaskModels updatedSubTask) {
        return subTaskRepository.findById(id).map(subTask -> {
            subTask.setTitle(updatedSubTask.getTitle());
            subTask.setDescription(updatedSubTask.getDescription());
            subTask.setCompleted(updatedSubTask.isCompleted());
            subTask.setTaskId(updatedSubTask.getTaskId());
            // ...add other fields as needed...
            return subTaskRepository.save(subTask);
        }).orElseThrow(() -> new RuntimeException("SubTask not found"));
    }

    public SubTaskModels patchSubTask(Long id, SubTaskModels patch) {
        return subTaskRepository.findById(id).map(subTask -> {
            if (patch.getTitle() != null) subTask.setTitle(patch.getTitle());
            if (patch.getDescription() != null) subTask.setDescription(patch.getDescription());
            if (patch.getTaskId() != null) subTask.setTaskId(patch.getTaskId());
            // For boolean, check for boxed type if needed
            if (patch.isCompleted() != subTask.isCompleted()) subTask.setCompleted(patch.isCompleted());
            // ...add other fields as needed...
            return subTaskRepository.save(subTask);
        }).orElseThrow(() -> new RuntimeException("SubTask not found"));
    }

    public List<SubTaskModels> getAllSubTasks() {
        return subTaskRepository.findAll();
    }
}
