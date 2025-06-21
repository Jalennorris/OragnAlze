package com.jalennorris.server.Repository;


import com.jalennorris.server.Models.UserGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GoalRepository extends JpaRepository<UserGoal, Long> {
    // Add custom query methods if needed
}
