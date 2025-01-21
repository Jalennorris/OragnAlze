package com.jalennorris.server.Controllers;

import com.jalennorris.server.enums.Role;
import com.jalennorris.server.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/private")
public class PrivateController {

    @Autowired
    private JwtUtil jwtUtil;

    // Admin-only endpoint
    @GetMapping("/admin")
    public ResponseEntity<String> adminAccess(@RequestHeader("Authorization") String authorizationHeader) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.substring(7); // Extract token
            String username = jwtUtil.extractUsername(token);

            if (jwtUtil.validateToken(token, username, null)) {
                Role role = jwtUtil.extractRole(token);
                if ("ADMIN".equals(role)) {
                    // Allow access
                    return ResponseEntity.ok("Welcome, Admin!");
                } else {
                    // Deny access
                    return ResponseEntity.status(HttpServletResponse.SC_FORBIDDEN)
                            .body("Access Denied: Insufficient Permissions");
                }
            } else {
                // Invalid token
                return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED)
                        .body("Invalid Token");
            }
        }
        return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED)
                .body("Missing Authorization Header");
    }
}