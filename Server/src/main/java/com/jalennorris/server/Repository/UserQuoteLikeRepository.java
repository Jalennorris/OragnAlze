package com.jalennorris.server.Repository;

import com.jalennorris.server.Models.UserQuoteLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserQuoteLikeRepository extends JpaRepository<UserQuoteLike, Long> {
    List<UserQuoteLike> findByUserId(Long userId);
    List<UserQuoteLike> findByUserIdAndFavoriteTrue(Long userId);
    List<UserQuoteLike> findByUserIdAndLikeTrue(Long userId);
    UserQuoteLike findByUserIdAndQuote_Id(Long userId, Long quoteId);
}
