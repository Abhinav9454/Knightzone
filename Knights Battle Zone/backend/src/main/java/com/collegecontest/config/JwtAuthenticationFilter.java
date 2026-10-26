package com.collegecontest.config;

import com.collegecontest.service.CustomUserDetailsService;
import com.collegecontest.service.JwtService;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.time.LocalDateTime;
import io.jsonwebtoken.ExpiredJwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private UserRepository userRepository;

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        if (jwt == null || jwt.trim().isEmpty() || jwt.equalsIgnoreCase("null")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String email = jwtService.extractEmail(jwt);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                autoRevokeExpiredAdmin(email);

                UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);

                if (jwtService.isTokenValid(jwt, email)) {

                    Collection<? extends GrantedAuthority> existing = userDetails.getAuthorities() != null
                            ? userDetails.getAuthorities()
                            : new ArrayList<>();

                    List<GrantedAuthority> authorities = new ArrayList<>();
                    authorities.addAll(existing);

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            authorities);

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }

        } catch (ExpiredJwtException eje) {
            logger.info("JWT token expired: {}", eje.getMessage());
            response.setHeader("X-Auth-Error", "expired");
        } catch (Exception e) {
            logger.warn("Invalid JWT Token: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private void autoRevokeExpiredAdmin(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.getRole() == Role.ADMIN
                    && user.getAdminExpiresAt() != null
                    && user.getAdminExpiresAt().isBefore(LocalDateTime.now())) {
                user.setRole(Role.USER);
                user.setAdminExpiresAt(null);
                userRepository.save(user);
            }
        });
    }
}
