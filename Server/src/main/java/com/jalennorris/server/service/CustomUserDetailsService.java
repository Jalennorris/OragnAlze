// package com.jalennorris.server.service;

// import com.jalennorris.server.Models.UserModels;
// import com.jalennorris.server.Repository.UserRepository;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.security.core.authority.SimpleGrantedAuthority;
// import org.springframework.security.core.userdetails.UserDetails;
// import org.springframework.security.core.userdetails.UserDetailsService;
// import org.springframework.security.core.userdetails.UsernameNotFoundException;
// import org.springframework.stereotype.Service;

// import java.util.Collections;
// import java.util.List;
// import java.util.logging.Level;
// import java.util.logging.Logger;

// @Service
// public class CustomUserDetailsService implements UserDetailsService {

//     private static final Logger LOGGER = Logger.getLogger(CustomUserDetailsService.class.getName());

//     private final UserRepository userRepository;

//     @Autowired
//     public CustomUserDetailsService(UserRepository userRepository) {
//         this.userRepository = userRepository;
//     }

//     /**
//      * Loads the user by username.
//      *
//      * @param username The username of the user to load.
//      * @return The UserDetails object containing user information.
//      * @throws UsernameNotFoundException If the user is not found.
//      */
//     @Override
//     public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
//         if (username == null || username.trim().isEmpty()) {
//             throw new UsernameNotFoundException("Username cannot be null or empty.");
//         }

//         LOGGER.log(Level.INFO, "Loading user by username: {0}", username);

//         UserModels user = userRepository.findByUsername(username)
//                 .orElseThrow(() -> {
//                     LOGGER.log(Level.SEVERE, "User not found: {0}", username);
//                     return new UsernameNotFoundException("User not found: " + username);
//                 });

//         // Ensure the role is not null
//         if (user.getRole() == null) {
//             LOGGER.log(Level.SEVERE, "User role is null for username: {0}", username);
//             throw new UsernameNotFoundException("User role is null for username: " + username);
//         }

//         // Create authorities with the role prefixed by "ROLE_"
//         List<SimpleGrantedAuthority> authorities = Collections.singletonList(
//                 new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
//         );

//         LOGGER.log(Level.INFO, "User loaded successfully: {0}", username);

//         return new org.springframework.security.core.userdetails.User(
//                 user.getUsername(),
//                 user.getPassword(),
//                 authorities
//         );
//     }
// }