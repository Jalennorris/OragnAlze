package com.jalennorris.server.repository;

import com.jalennorris.server.Models.SubTaskModels;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubTaskRepository extends JpaRepository<SubTaskModels, Long> {
    List<SubTaskModels> findByTaskId(Long taskId);

    // Optional: Explicitly declare findAll (not required, just for clarity)
    @Override
    List<SubTaskModels> findAll();
}
