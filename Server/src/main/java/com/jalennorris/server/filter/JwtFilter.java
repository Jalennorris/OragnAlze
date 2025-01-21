package com.jalennorris.server.filter;

import com.jalennorris.server.enums.Role;
import com.jalennorris.server.util.JwtUtil;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtFilter implements Filter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public void doFilter(
            jakarta.servlet.ServletRequest servletRequest,
            jakarta.servlet.ServletResponse servletResponse,
            FilterChain filterChain) throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        String requestPath = request.getRequestURI();
        String method = request.getMethod();
        System.out.println("Request Path: " + requestPath);
        System.out.println("HTTP Method: " + method);

        // Allow unauthenticated access to specific public endpoints
        if (("/api/users".equals(requestPath) && "POST".equalsIgnoreCase(method)) ||
                "/api/users/login".equals(requestPath)) {
            System.out.println("Public endpoint accessed: " + requestPath);
            filterChain.doFilter(request, response);
            return;
        }

        // Extract the Authorization header
        String authorizationHeader = request.getHeader("Authorization");
        System.out.println("Authorization Header: " + authorizationHeader);

        // Validate Authorization header presence
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.substring(7); // Extract token from header
            System.out.println("Extracted Token: " + token);

            try {
                // Extract username and validate token
                String username = jwtUtil.extractUsername(token);
                System.out.println("Extracted Username: " + username);

                Role role = jwtUtil.extractRole(token); // Extract role from token
                System.out.println("Extracted Role: " + role);

                // Validate token and role
                if (username != null && jwtUtil.validateToken(token, username, role)) {
                    System.out.println("Token validated for user: " + username);

                    // Role-based access control
                    if (role == Role.ADMIN || role == Role.USER) {
                        System.out.println("Access granted for role: " + role);
                        filterChain.doFilter(request, response); // Allow the request to proceed
                        return;
                    } else {
                        System.out.println("Access denied for role: " + role);
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.getWriter().write("Access Denied: Insufficient Permissions");
                        return;
                    }
                } else {
                    System.out.println("Token validation failed.");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("Invalid Token");
                    return;
                }
            } catch (Exception e) {
                System.out.println("Error during token validation: " + e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Token Processing Error");
                return;
            }
        } else {
            // Missing or invalid Authorization header
            System.out.println("Missing or invalid Authorization header.");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Missing Authorization Header");
            return;
        }
    }
}