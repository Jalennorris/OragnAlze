package com.jalennorris.server.Controllers;
import com.jalennorris.server.Models.TasksModels;
import com.jalennorris.server.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TasksControllers {


    private final TaskService taskService;


    @Autowired
    public TasksControllers(TaskService taskService) {

        this.taskService = taskService;
    }


    @GetMapping
    public ResponseEntity<List<TasksModels>> getTasks() {
        List<TasksModels> tasks = taskService.getAllTasks();
        return ResponseEntity.ok(tasks);
    }


    @GetMapping("/{id}")
    public ResponseEntity<TasksModels> getTask(@PathVariable("id") long id) {
        TasksModels task = taskService.getTaskById(id);
        return ResponseEntity.ok(task);
    }


    @PostMapping
    public ResponseEntity <TasksModels> createTask(@RequestBody TasksModels newTask) {
        TasksModels tasks = taskService.createTask(newTask);
        return ResponseEntity.ok(tasks);
    }


    @PutMapping("/{id}")
    public ResponseEntity<TasksModels> updateTask(@PathVariable long id, @RequestBody TasksModels updatedTask) {
        TasksModels task = taskService.updateTask(id, updatedTask);
        if (task != null) {
            return ResponseEntity.ok(task);
        } else {
            return ResponseEntity.notFound().build();
        }
    }


    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable long id){
       boolean success = taskService.deleteTask(id);
       if (success) {
           ResponseEntity.noContent().build();
       }
         ResponseEntity.notFound().build();

    }
}