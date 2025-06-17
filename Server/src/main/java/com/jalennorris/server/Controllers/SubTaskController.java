package com.jalennorris.server.Controllers;

import com.jalennorris.server.Models.SubTaskModels;
import com.jalennorris.server.service.SubTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subtasks")
public class SubTaskController {

    private final SubTaskService subTaskService;

    @Autowired
    public SubTaskController(SubTaskService subTaskService) {
        this.subTaskService = subTaskService;
    }

    @GetMapping("/task/{taskId}")
    public List<SubTaskModels> getSubTasksByTaskId(@PathVariable Long taskId) {
        return subTaskService.getSubTasksByTaskId(taskId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubTaskModels> getSubTaskById(@PathVariable Long id) {
        return subTaskService.getSubTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<SubTaskModels> getAllSubTasks() {
        return subTaskService.getAllSubTasks();
    }

    @PostMapping
    public SubTaskModels createSubTask(@RequestBody SubTaskModels subTask) {
        return subTaskService.saveSubTask(subTask);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubTaskModels> updateSubTask(@PathVariable Long id, @RequestBody SubTaskModels updatedSubTask) {
        try {
            return ResponseEntity.ok(subTaskService.updateSubTask(id, updatedSubTask));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<SubTaskModels> patchSubTask(@PathVariable Long id, @RequestBody SubTaskModels patch) {
        try {
            return ResponseEntity.ok(subTaskService.patchSubTask(id, patch));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubTask(@PathVariable Long id) {
        subTaskService.deleteSubTask(id);
        return ResponseEntity.noContent().build();
    }
}
