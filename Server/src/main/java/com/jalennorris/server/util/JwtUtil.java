package com.jalennorris.server.util;

import com.jalennorris.server.enums.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Collections;
import java.util.Date;
import java.util.logging.Logger;

@Component
@Configuration
public class JwtUtil {

    private static final Logger LOGGER = Logger.getLogger(JwtUtil.class.getName());

    @Value("${jwt.secret}") // Load from application.properties or application.yml
    private String secretKey;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    // Generate a JWT token for a user
    public String generateToken(String username, Role role) {
        String prefixedRole = "ROLE_" + role.name(); // Ensure the role has "ROLE_" prefix
        LOGGER.info("Generating token for user: " + username + ", Role: " + prefixedRole);
        return Jwts.builder()
                .setSubject(username)
                .claim("role", prefixedRole) // Add prefixed role to token claims
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60)) // Token valid for 1 hour
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Extract role from token
    public Role extractRole(String token) {
        try {
            Claims claims = extractAllClaims(token);
            String roleString = claims.get("role", String.class);
            LOGGER.info("Extracted Role: " + roleString);
            return Role.valueOf(roleString.replace("ROLE_", "")); // Remove prefix and convert to enum
        } catch (Exception e) {
            LOGGER.severe("Error extracting role: " + e.getMessage());
            return null; // Return null if the role cannot be extracted
        }
    }

    // Validate if the user has the required role
    public boolean hasRole(String token, Role requiredRole) {
        Role role = extractRole(token);
        if (role == null) {
            LOGGER.warning("Role is null. Token might be invalid.");
            return false;
        }
        return role == requiredRole;
    }

    // Validate the token
    public boolean validateToken(String token, String username, Role role) {
        try {
            String extractedUsername = extractUsername(token);
            Role extractedRole = extractRole(token);
            boolean isValid = extractedUsername != null &&
                    extractedUsername.equals(username) &&
                    extractedRole == role &&
                    !isTokenExpired(token);
            LOGGER.info("Token validation result: " + isValid);
            return isValid;
        } catch (Exception e) {
            LOGGER.severe("Token validation error: " + e.getMessage());
            return false;
        }
    }

    // Extract username from token
    public String extractUsername(String token) {
        try {
            String username = extractAllClaims(token).getSubject();
            LOGGER.info("Extracted Username: " + username);
            return username;
        } catch (Exception e) {
            LOGGER.severe("Error extracting username: " + e.getMessage());
            return null;
        }
    }

    // Check if the token is expired
    private boolean isTokenExpired(String token) {
        Date expiration = extractExpiration(token);
        LOGGER.info("Token Expiration: " + expiration);
        return expiration.before(new Date());
    }

    private Date extractExpiration(String token) {
        try {
            return extractAllClaims(token).getExpiration();
        } catch (Exception e) {
            LOGGER.severe("Error extracting expiration: " + e.getMessage());
            return null;
        }
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            LOGGER.severe("Error extracting claims: " + e.getMessage());
            throw e;
        }
    }
}