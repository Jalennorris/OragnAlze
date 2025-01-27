package com.jalennorris.server.util;

import com.jalennorris.server.enums.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

@Component
public class JwtUtil {

    private static final Logger LOGGER = Logger.getLogger(JwtUtil.class.getName());
    private static final String ROLE_PREFIX = "ROLE_";

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration:3600000}") // Default: 1 hour
    private long jwtExpirationMs;

    @Value("${jwt.refreshExpiration:86400000}") // Default: 24 hours
    private long jwtRefreshExpirationMs;

    /**
     * Generates a signing key from the Base64-encoded secret key.
     *
     * @return SecretKey for signing JWTs.
     * @throws RuntimeException if the secret key is invalid.
     */
    private SecretKey getSigningKey() {
        if (secretKey == null || secretKey.trim().isEmpty()) {
            throw new RuntimeException("JWT secret key is not configured.");
        }
        try {
            byte[] decodedKey = Base64.getDecoder().decode(secretKey);
            return Keys.hmacShaKeyFor(decodedKey);
        } catch (IllegalArgumentException e) {
            LOGGER.log(Level.SEVERE, "Invalid Base64-encoded secret key: {0}", e.getMessage());
            throw new RuntimeException("Failed to decode JWT secret key.", e);
        }
    }

    /**
     * Generates a JWT token for the given username and role.
     *
     * @param username The username to include in the token.
     * @param role     The role to include in the token.
     * @return A signed JWT token.
     * @throws IllegalArgumentException if username or role is null.
     */
    public String generateToken(@NonNull String username, @NonNull Role role) {
        String prefixedRole = ROLE_PREFIX + role.name();
        LOGGER.log(Level.INFO, "Generating token for user: {0}, Role: {1}", new Object[]{username, prefixedRole});

        return Jwts.builder()
                .setSubject(username)
                .claim("role", prefixedRole)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Generates a refresh token for the given username.
     *
     * @param username The username to include in the refresh token.
     * @return A signed refresh token.
     * @throws IllegalArgumentException if username is null.
     */
    public String generateRefreshToken(@NonNull String username) {
        LOGGER.log(Level.INFO, "Generating refresh token for user: {0}", username);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtRefreshExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Validates a JWT token for the given username and role.
     *
     * @param token    The JWT token to validate.
     * @param username The expected username.
     * @param role     The expected role.
     * @return True if the token is valid, false otherwise.
     */
    public boolean validateToken(@NonNull String token, @NonNull String username, @NonNull Role role) {
        try {
            Claims claims = extractAllClaims(token);
            String extractedUsername = claims.getSubject();
            String extractedRole = claims.get("role", String.class);

            return username.equals(extractedUsername)
                    && (ROLE_PREFIX + role.name()).equals(extractedRole)
                    && !isTokenExpired(token);
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Token validation error for token: {0}, error: {1}", new Object[]{token, e.getMessage()});
            return false;
        }
    }

    /**
     * Extracts the username from a JWT token.
     *
     * @param token The JWT token.
     * @return An Optional containing the username, or empty if extraction fails.
     */
    public Optional<String> extractUsername(@NonNull String token) {
        try {
            return Optional.ofNullable(extractAllClaims(token).getSubject());
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Username extraction error for token: {0}, error: {1}", new Object[]{token, e.getMessage()});
            return Optional.empty();
        }
    }

    /**
     * Extracts the role from a JWT token.
     *
     * @param token The JWT token.
     * @return An Optional containing the role, or empty if extraction fails.
     */
    public Optional<Role> extractRole(@NonNull String token) {
        try {
            String roleString = extractAllClaims(token).get("role", String.class);
            return Optional.of(Role.valueOf(roleString.replace(ROLE_PREFIX, "")));
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Role extraction error for token: {0}, error: {1}", new Object[]{token, e.getMessage()});
            return Optional.empty();
        }
    }

    /**
     * Checks if a JWT token is expired.
     *
     * @param token The JWT token.
     * @return True if the token is expired, false otherwise.
     */
    private boolean isTokenExpired(@NonNull String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Token expiration check error for token: {0}, error: {1}", new Object[]{token, e.getMessage()});
            return true;
        }
    }

    /**
     * Extracts the expiration date from a JWT token.
     *
     * @param token The JWT token.
     * @return The expiration date, or null if extraction fails.
     */
    private Date extractExpiration(@NonNull String token) {
        try {
            return extractAllClaims(token).getExpiration();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Expiration extraction error for token: {0}, error: {1}", new Object[]{token, e.getMessage()});
            return null;
        }
    }

    /**
     * Extracts all claims from a JWT token.
     *
     * @param token The JWT token.
     * @return The claims.
     * @throws RuntimeException if claims extraction fails.
     */
    private Claims extractAllClaims(@NonNull String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Claims extraction error for token: {0}, error: {1}", new Object[]{token, e.getMessage()});
            throw new RuntimeException("Failed to extract JWT claims.", e);
        }
    }
}