package com.jalennorris.server.Models;

import jakarta.persistence.*; // Use jakarta for Spring Boot 3+
import java.time.ZonedDateTime;

@Entity
@Table(name = "favorites_and_likes")
public class UserQuoteLike {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @ManyToOne
    @JoinColumn(name = "quote_id")
    private MotivationalQuotesModel quote;

    private boolean favorite;

    @Column(name = "likes")
    private boolean like;

    @Column(name = "created_at")
    private ZonedDateTime created_at;

    public UserQuoteLike() {}

    public UserQuoteLike(Long userId, MotivationalQuotesModel quote, boolean favorite, boolean like, ZonedDateTime created_at) {
        this.userId = userId;
        this.quote = quote;
        this.favorite = favorite;
        this.like = like;
        this.created_at = created_at;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public MotivationalQuotesModel getQuote() { return quote; }
    public void setQuote(MotivationalQuotesModel quote) { this.quote = quote; }

    public boolean isFavorite() { return favorite; }
    public void setFavorite(boolean favorite) { this.favorite = favorite; }

    public boolean isLike() { return like; }
    public void setLike(boolean like) { this.like = like; }

    public ZonedDateTime getCreated_at() { return created_at; }

    public void setCreated_at(ZonedDateTime created_at){
        this.created_at = created_at;
    }
}