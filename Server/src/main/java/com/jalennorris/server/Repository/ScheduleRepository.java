package com.jalennorris.server.Repository;

import com.jalennorris.server.Models.ScheduleModels;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleRepository extends JpaRepository<ScheduleModels, Long> {
    // You can add custom queries here if needed
}