package com.jalennorris.server.dto;

import java.time.ZonedDateTime;
import com.jalennorris.server.Models.UserQuoteLike;

public class UserQuoteLikeDTO {
    private Long id;
    private Long userId;
    private Long quoteId;
    private boolean favorite;
    private boolean like;
    private ZonedDateTime created_at;

    public UserQuoteLikeDTO() {}

    public UserQuoteLikeDTO(Long id, Long userId, Long quoteId, boolean favorite, boolean like, ZonedDateTime created_at) {
        this.id = id;
        this.userId = userId;
        this.quoteId = quoteId;
        this.favorite = favorite;
        this.like = like;
        this.created_at = created_at;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getQuoteId() { return quoteId; }
    public void setQuoteId(Long quoteId) { this.quoteId = quoteId; }

    public boolean isFavorite() { return favorite; }
    public void setFavorite(boolean favorite) { this.favorite = favorite; }

    public boolean isLike() { return like; }
    public void setLike(boolean like) { this.like = like; }

    public ZonedDateTime getCreated_at() { return created_at; }
    public void setCreated_at(ZonedDateTime created_at) { this.created_at = created_at; }
}
