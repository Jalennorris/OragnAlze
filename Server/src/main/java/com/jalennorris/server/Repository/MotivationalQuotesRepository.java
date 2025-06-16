package com.jalennorris.server.Repository;

import com.jalennorris.server.Models.MotivationalQuotesModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MotivationalQuotesRepository extends JpaRepository<MotivationalQuotesModel, Long> {
    // Add custom query methods if needed
}