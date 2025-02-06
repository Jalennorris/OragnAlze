package com.jalennorris.server.Repository;


import com.jalennorris.server.Models.TasksModels;


import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface TasksRepository extends JpaRepository<TasksModels, Long> {
    List<TasksModels> findByUserId(long userId);


    // You can add custom queries here if needed
}