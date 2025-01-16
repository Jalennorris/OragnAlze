package com.jalennorris.server.Repository;
import com.jalennorris.server.Models.UserModels;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserModels, Long> {
    Optional<UserModels> findByUsername(String username);
}