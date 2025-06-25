package com.jalennorris.server.Controllers;

import com.jalennorris.server.dto.UserGoalDTO;
import com.jalennorris.server.service.GoalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/goals")
public class GoalsController {

    @Autowired
    private GoalService goalService;

    @GetMapping
    public ResponseEntity<List<UserGoalDTO>> getAllGoals() {
        return ResponseEntity.ok(goalService.getAllGoals());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserGoalDTO> getGoalById(@PathVariable Long id) {
        Optional<UserGoalDTO> goal = goalService.getGoalById(id);
        return goal.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserGoalDTO>> getGoalsByUserId(@PathVariable Long userId) {
        List<UserGoalDTO> goals = goalService.getGoalsByUserId(userId);
        return ResponseEntity.ok(goals);
    }

    @PostMapping
    public ResponseEntity<UserGoalDTO> createGoal(@RequestBody UserGoalDTO goalDTO) {
        UserGoalDTO created = goalService.createGoal(goalDTO);
        return ResponseEntity.status(201).body(created);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserGoalDTO> updateGoal(@PathVariable Long id, @RequestBody UserGoalDTO goalDTO) {
        Optional<UserGoalDTO> updated = goalService.updateGoal(id, goalDTO);
        return updated.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(@PathVariable Long id) {
        goalService.deleteGoal(id);
        return ResponseEntity.noContent().build();
    }
}
