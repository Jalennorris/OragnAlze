package com.jalennorris.server.filter;

import com.jalennorris.server.util.JwtUtil;
import com.jalennorris.server.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.logging.Logger;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger LOGGER = Logger.getLogger(JwtFilter.class.getName());

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Autowired
    public JwtFilter(JwtUtil jwtUtil, CustomUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authorizationHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;
        String role = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            token = authorizationHeader.substring(7); // Extract token from header
            try {
                username = jwtUtil.extractUsername(token);
                role = jwtUtil.extractRole(token).name();
                LOGGER.info("Extracted Username: " + username);
                LOGGER.info("Extracted Role: " + role);
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    if (jwtUtil.validateToken(token, userDetails.getUsername(), jwtUtil.extractRole(token))) {
                        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                        LOGGER.info("JWT Token is valid. Setting authentication for user: " + username);

                        // Log details of the authentication object
                        LOGGER.info("Authentication details: " + authenticationToken);
                        LOGGER.info("Authorities: " + authenticationToken.getAuthorities());
                    } else {
                        LOGGER.warning("JWT Token is invalid.");
                    }
                }
            } catch (Exception e) {
                LOGGER.severe("Token validation error: " + e.getMessage());
            }
        } else {
            LOGGER.warning("JWT Token does not begin with Bearer String");
        }

        filterChain.doFilter(request, response);
    }
}