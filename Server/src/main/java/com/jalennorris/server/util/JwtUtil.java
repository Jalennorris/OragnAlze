package com.jalennorris.server.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
@Configuration
public class JwtUtil {

    private String secretKey = "your_secret_key"; // You can externalize this for security reasons

    // Generate a JWT token for a user
    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60)) // token expires in 1 hour
                .signWith(SignatureAlgorithm.HS256, secretKey)
                .compact();
    }

    // Validate the token
    public boolean validateToken(String token, String username) {
        String user = extractUsername(token);
        return (user.equals(username) && !isTokenExpired(token));
    }

    // Extract username from token
    public String extractUsername(String token) {
        return Jwts.parser()
                .setSigningKey(secretKey)
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // Check if the token is expired
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return Jwts.parser()
                .setSigningKey(secretKey)
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
    }
}