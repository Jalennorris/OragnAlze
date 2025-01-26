package com.jalennorris.server.filter;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.logging.Logger;

@Component
public class AuthorizationFilter extends OncePerRequestFilter {

    private static final Logger LOGGER = Logger.getLogger(AuthorizationFilter.class.getName());

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()) {
            // Add your custom authorization logic here
            boolean hasPermission = checkUserPermissions(authentication);

            if (!hasPermission) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "You do not have the required permissions");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean checkUserPermissions(Authentication authentication) {
        // Implement your custom permission check logic
        // For example, check if the user has a specific role or permission
        return authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
    }
}