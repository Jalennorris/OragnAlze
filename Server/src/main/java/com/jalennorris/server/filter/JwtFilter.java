package com.jalennorris.server.filter;

import com.jalennorris.server.enums.Role;
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
import java.util.Optional;
import java.util.logging.Logger;
import java.util.logging.Level;

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
        Optional<String> usernameOpt = Optional.empty();
        Optional<Role> roleOpt = Optional.empty();

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            token = authorizationHeader.substring(7); // Extract token from header
            try {
                usernameOpt = jwtUtil.extractUsername(token);
                roleOpt = jwtUtil.extractRole(token);

                if (usernameOpt.isPresent() && roleOpt.isPresent()) {
                    String username = usernameOpt.get();
                    Role role = roleOpt.get();
                    LOGGER.log(Level.INFO, "Extracted Username: {0}", username);
                    LOGGER.log(Level.INFO, "Extracted Role: {0}", role.name());

                    if (SecurityContextHolder.getContext().getAuthentication() == null) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                        if (jwtUtil.validateToken(token, username, role)) {
                            UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                            authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                            LOGGER.log(Level.INFO, "JWT Token is valid. Setting authentication for user: {0}", username);

                            // Log details of the authentication object
                            LOGGER.log(Level.INFO, "Authentication details: {0}", authenticationToken);
                            LOGGER.log(Level.INFO, "Authorities: {0}", authenticationToken.getAuthorities());
                        } else {
                            LOGGER.warning("JWT Token is invalid.");
                        }
                    }
                }
            } catch (Exception e) {
                LOGGER.log(Level.SEVERE, "Token validation error: {0}", e.getMessage());
            }
        } else {
            LOGGER.warning("JWT Token does not begin with Bearer String");
        }

        filterChain.doFilter(request, response);
    }
}