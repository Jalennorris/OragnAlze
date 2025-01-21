package com.jalennorris.server.enums;

public enum Role {
    ADMIN("Administrator with full access"),
    USER("Regular user with limited access");

    private final String description;

    Role(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}