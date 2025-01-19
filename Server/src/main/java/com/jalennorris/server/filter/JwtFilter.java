package com.jalennorris.server.filter;

import com.jalennorris.server.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.Filter;
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
        // Allow unauthenticated access to specific endpoints
        String requestPath = request.getRequestURI();
        if ("/api/users".equals(requestPath) && "POST".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response); // Skip JWT validation for createUser
            return;
        }


        String authorizationHeader = request.getHeader("Authorization");

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.substring(7); // Extract the token
            String username = jwtUtil.extractUsername(token);

            if (jwtUtil.validateToken(token, username)) {
                String role = jwtUtil.extractRole(token);
                if ("ADMIN".equals(role)) {
                    // Allow access for ADMIN
                    filterChain.doFilter(request, response);
                } else {
                    // Deny access for non-ADMIN roles
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("Access Denied: Insufficient Permissions");
                    return;
                }
            } else {
                // Invalid token
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Invalid Token");
                return;
            }
        } else {
            // No token provided
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Missing Authorization Header");
            return;
        }
    }
}