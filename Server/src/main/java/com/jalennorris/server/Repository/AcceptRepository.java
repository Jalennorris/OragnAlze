package com.jalennorris.server.Repository;

import com.jalennorris.server.Models.AcceptedTask;
import com.jalennorris.server.Models.UserModels;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AcceptRepository extends JpaRepository<AcceptedTask, Long> {
    // Add custom query methods if needed
    List<AcceptedTask> findByUser( Long user);
}
