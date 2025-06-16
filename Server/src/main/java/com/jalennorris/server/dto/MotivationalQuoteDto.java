package com.jalennorris.server.dto;
import java.time.LocalDateTime;

public class MotivationalQuoteDto {
    private Long id;
    private String quote;
    private String author;
    private String type;
    private LocalDateTime created_at;

    public MotivationalQuoteDto() {}

    public MotivationalQuoteDto( Long id,String quote, String author, String type, LocalDateTime created_at) {
        this.id = id;
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
