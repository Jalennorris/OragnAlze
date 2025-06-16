package com.jalennorris.server.Models;

import jakarta.persistence.*; // Use jakarta for Spring Boot 3+
import java.time.LocalDateTime;

@Entity
@Table(name = "motivational_quotes")
public class MotivationalQuotesModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String quote;
    private String author;
    private String type;

    @Column(name = "created_at")
    private LocalDateTime created_at;

    public MotivationalQuotesModel() {}

    public MotivationalQuotesModel(String quote, String author, String type, LocalDateTime created_at) {
        this.quote = quote;
        this.author = author;
        this.type = type;
        this.created_at = created_at;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getQuote() {
        return quote;
    }

    public void setQuote(String quote) {
        this.quote = quote;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDateTime getCreated_at() {
        return created_at;
    }

    public void setCreated_at(LocalDateTime created_at) {
        this.created_at = created_at;
    }
}