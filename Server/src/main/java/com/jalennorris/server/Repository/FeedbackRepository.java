package com.jalennorris.server.Repository;


import com.jalennorris.server.Models.UserFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackRepository extends JpaRepository<UserFeedback ,Long> {
    // Add custom query methods if needed
}
