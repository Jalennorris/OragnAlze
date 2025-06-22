package com.jalennorris.server.Controllers;

import com.jalennorris.server.Models.UserQuoteLike;
import com.jalennorris.server.service.UserQuoteLikeService;
import com.jalennorris.server.dto.UserQuoteLikeDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user-quote-likes")
@CrossOrigin(methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS, RequestMethod.PATCH, RequestMethod.PUT})
public class UserQuoteLikeController {

    @Autowired
    private UserQuoteLikeService service;

    public static class UserQuoteLikeRequest {
        public Boolean favorite;
        public Boolean like;
    }

    @PostMapping(value = "/{userId}/{quoteId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public UserQuoteLikeDTO createUserQuoteLike(
            @PathVariable Long userId,
            @PathVariable Long quoteId,
            @RequestBody UserQuoteLikeRequest request
    ) {
        boolean favorite = request.favorite != null ? request.favorite : false;
        boolean like = request.like != null ? request.like : false;
        return toDTO(service.likeOrFavoriteQuote(userId, quoteId, favorite, like));
    }

    @PatchMapping(value = "/{userId}/{quoteId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public UserQuoteLikeDTO patchUserQuoteLike(
            @PathVariable Long userId,
            @PathVariable Long quoteId,
            @RequestBody UserQuoteLikeRequest request
    ) {
        return toDTO(service.patchLikeOrFavoriteStatus(userId, quoteId, request.favorite, request.like));
    }

    private UserQuoteLikeDTO toDTO(UserQuoteLike entity) {
        return new UserQuoteLikeDTO(
                entity.getId(),
                entity.getUserId(),
                entity.getQuote() != null ? entity.getQuote().getId() : null,
                entity.isFavorite(),
                entity.isLike(),
                entity.getCreated_at()
        );
    }
}
