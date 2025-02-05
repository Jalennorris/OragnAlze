package com.jalennorris.server.Response;

public class ChangePasswordResponse {

    private String token;

    public ChangePasswordResponse(String token) {
        this.token = token;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
