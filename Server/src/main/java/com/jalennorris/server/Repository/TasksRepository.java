package com.jalennorris.server.Repository;

import com.jalennorris.server.Models.TasksModels;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TasksRepository extends JpaRepository<TasksModels, Long> {
    // You can add custom queries here if needed
}