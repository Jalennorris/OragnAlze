package com.jalennorris.server.Repository;

import com.jalennorris.server.Models.UserFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<UserFeedback, Long> {
    
    List<UserFeedback> findByUser(Long user);
    // Add custom query methods if needed
}
