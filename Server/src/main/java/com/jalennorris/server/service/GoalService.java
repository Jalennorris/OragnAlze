package com.jalennorris.server.service;

import com.jalennorris.server.Models.UserGoal;
import com.jalennorris.server.dto.UserGoalDTO;
import com.jalennorris.server.Repository.GoalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class GoalService {
    @Autowired
    private GoalRepository goalRepository;

    // Create
    public UserGoalDTO createGoal(UserGoalDTO goalDTO) {
        UserGoal userGoal = UserGoal.fromDTO(goalDTO);
        UserGoal saved = goalRepository.save(userGoal);
        return saved.toDTO();
    }

    // Read all
    public List<UserGoalDTO> getAllGoals() {
        return goalRepository.findAll()
                .stream()
                .map(UserGoal::toDTO)
                .collect(Collectors.toList());
    }

    // Read by id
    public Optional<UserGoalDTO> getGoalById(Long id) {
        return goalRepository.findById(id)
                .map(UserGoal::toDTO);
    }

    // Update
    public Optional<UserGoalDTO> updateGoal(Long id, UserGoalDTO updatedGoalDTO) {
        return goalRepository.findById(id).map(goal -> {
            goal.setUser(updatedGoalDTO.getUser());
            goal.setGoalText(updatedGoalDTO.getGoalText());
            goal.setCreatedAt(updatedGoalDTO.getCreatedAt());
            // ...add other fields as needed...
            UserGoal saved = goalRepository.save(goal);
            return saved.toDTO();
        });
    }

    // Delete
    public void deleteGoal(Long id) {
        goalRepository.deleteById(id);
    }
}
