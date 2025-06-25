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
        UserGoal userGoal = new UserGoal();
        userGoal.setUser(goalDTO.getUser());
        userGoal.setGoalText(goalDTO.getGoalText());
        userGoal.setCreatedAt(goalDTO.getCreatedAt());
        // ...set other fields as needed...
        UserGoal saved = goalRepository.save(userGoal);
        return new UserGoalDTO(
            saved.getId(),
            saved.getUser(),
            saved.getGoalText(),
            saved.getCreatedAt()
            // ...add other fields as needed...
        );
    }

    // Read all
    public List<UserGoalDTO> getAllGoals() {
        return goalRepository.findAll()
                .stream()
                .map(goal -> new UserGoalDTO(
                    goal.getId(),
                    goal.getUser(),
                    goal.getGoalText(),
                    goal.getCreatedAt()
                    // ...add other fields as needed...
                ))
                .collect(Collectors.toList());
    }

    // Get all goals by user ID
    public List<UserGoalDTO> getGoalsByUserId(Long userId) {
        return goalRepository.findAll()
                .stream()
                .filter(goal -> goal.getUser() != null && goal.getUser().equals(userId))
                .map(goal -> new UserGoalDTO(
                    goal.getId(),
                    goal.getUser(),
                    goal.getGoalText(),
                    goal.getCreatedAt()
                    // ...add other fields as needed...
                ))
                .collect(Collectors.toList());
    }

    // Read by id
    public Optional<UserGoalDTO> getGoalById(Long id) {
        return goalRepository.findById(id)
                .map(goal -> new UserGoalDTO(
                    goal.getId(),
                    goal.getUser(),
                    goal.getGoalText(),
                    goal.getCreatedAt()
                    // ...add other fields as needed...
                ));
    }

    // Update
    public Optional<UserGoalDTO> updateGoal(Long id, UserGoalDTO updatedGoalDTO) {
        return goalRepository.findById(id).map(goal -> {
            goal.setUser(updatedGoalDTO.getUser());
            goal.setGoalText(updatedGoalDTO.getGoalText());
            goal.setCreatedAt(updatedGoalDTO.getCreatedAt());
            // ...add other fields as needed...
            UserGoal saved = goalRepository.save(goal);
            return new UserGoalDTO(
                saved.getId(),
                saved.getUser(),
                saved.getGoalText(),
                saved.getCreatedAt()
                // ...add other fields as needed...
            );
        });
    }

    // Delete
    public void deleteGoal(Long id) {
        goalRepository.deleteById(id);
    }
}
