package com.jalennorris.server.util;
import com.jalennorris.server.enums.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.logging.Logger;

@Component
public class JwtUtil {

    private static final Logger LOGGER = Logger.getLogger(JwtUtil.class.getName());
    private static final String ROLE_PREFIX = "ROLE_";

    @Value("${jwt.secret}")
    private String secretKey;
    @Value("${jwt.expiration:3600000}")
    private long jwtExpirationMs;
    @Value("${jwt.refreshExpiration:86400000}")
    private long jwtRefreshExpirationMs;

    private SecretKey getSigningKey() {
        try {
            byte[] decodedKey = Base64.getDecoder().decode(secretKey);
            return Keys.hmacShaKeyFor(decodedKey);
        } catch (IllegalArgumentException e) {
            LOGGER.severe("Invalid Base64-encoded secret key: " + e.getMessage());
            throw new RuntimeException("Failed to decode JWT secret key.", e);
        }
    }

    public String generateToken(String username, Role role) {
        String prefixedRole = ROLE_PREFIX + role.name();
        LOGGER.info("Generating token for user: " + username + ", Role: " + prefixedRole);
        return Jwts.builder()
                .setSubject(username)
                .claim("role", prefixedRole)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(String username) {
        LOGGER.info("Generating refresh token for user: " + username);
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtRefreshExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token, String username, Role role) {
        try {
            Claims claims = extractAllClaims(token);
            String extractedUsername = claims.getSubject();
            String extractedRole = claims.get("role", String.class);
            return (username.equals(extractedUsername) && (ROLE_PREFIX + role.name()).equals(extractedRole) && !isTokenExpired(token));
        } catch (Exception e) {
            LOGGER.severe("Token validation error: " + e.getMessage());
            return false;
        }
    }

    public String extractUsername(String token) {
        try {
            return extractAllClaims(token).getSubject();
        } catch (Exception e) {
            LOGGER.severe("Username extraction error: " + e.getMessage());
            return null;
        }
    }

    public Role extractRole(String token) {
        try {
            String roleString = extractAllClaims(token).get("role", String.class);
            return Role.valueOf(roleString.replace(ROLE_PREFIX, ""));
        } catch (Exception e) {
            LOGGER.severe("Role extraction error: " + e.getMessage());
            return null;
        }
    }

    private boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            LOGGER.severe("Token expiration check error: " + e.getMessage());
            return true;
        }
    }

    private Date extractExpiration(String token) {
        try {
            return extractAllClaims(token).getExpiration();
        } catch (Exception e) {
            LOGGER.severe("Expiration extraction error: " + e.getMessage());
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
            LOGGER.severe("Claims extraction error: " + e.getMessage());
            return null;
        }
    }
}