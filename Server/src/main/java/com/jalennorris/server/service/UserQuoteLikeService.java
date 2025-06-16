package com.jalennorris.server.Service;

import com.jalennorris.server.Models.UserQuoteLike;
import com.jalennorris.server.Models.MotivationalQuotesModel;
import com.jalennorris.server.Repository.UserQuoteLikeRepository;
import com.jalennorris.server.Repository.MotivationalQuotesRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;

@Service
public class UserQuoteLikeService {

    @Autowired
    private UserQuoteLikeRepository userQuoteLikeRepository;

    @Autowired
    private MotivationalQuotesRepository motivationalQuotesRepository;

    // Like or favorite a quote for a user (create if not exists, update if exists)
    public UserQuoteLike likeOrFavoriteQuote(Long userId, Long quoteId, boolean favorite, boolean like) {
        UserQuoteLike userQuoteLike = userQuoteLikeRepository.findByUserIdAndQuote_Id(userId, quoteId);
        MotivationalQuotesModel quote = motivationalQuotesRepository.findById(quoteId).orElse(null);

        if (quote == null) {
            throw new IllegalArgumentException("Quote not found");
        }

        if (userQuoteLike == null) {
            userQuoteLike = new UserQuoteLike(userId, quote, favorite, like, ZonedDateTime.now());
        } else {
            userQuoteLike.setFavorite(favorite);
            userQuoteLike.setLike(like);
        }
        return userQuoteLikeRepository.save(userQuoteLike);
    }

    // Update like/favorite status for a user and quote (PATCH)
    public UserQuoteLike patchLikeOrFavoriteStatus(Long userId, Long quoteId, Boolean favorite, Boolean like) {
        UserQuoteLike userQuoteLike = userQuoteLikeRepository.findByUserIdAndQuote_Id(userId, quoteId);
        if (userQuoteLike == null) {
            throw new IllegalArgumentException("UserQuoteLike not found for userId: " + userId + " and quoteId: " + quoteId);
        }
        if (favorite != null) {
            userQuoteLike.setFavorite(favorite);
        }
        if (like != null) {
            userQuoteLike.setLike(like);
        }
        return userQuoteLikeRepository.save(userQuoteLike);
    }

    // Unlike or unfavorite a quote (delete the record)
    public void unlikeOrUnfavoriteQuote(Long userId, Long quoteId) {
        UserQuoteLike userQuoteLike = userQuoteLikeRepository.findByUserIdAndQuote_Id(userId, quoteId);
        if (userQuoteLike != null) {
            userQuoteLikeRepository.delete(userQuoteLike);
        }
    }
}
