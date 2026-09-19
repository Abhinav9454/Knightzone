package com.collegecontest.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class LoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);
    private static final Set<String> AUDIT_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String requestId = request.getHeader("X-Request-Id");
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        String correlationId = request.getHeader("X-Correlation-Id");
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = requestId;
        }

        String userId = null;
        Set<String> roles = Set.of();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null) {
            userId = auth.getName();
            roles = auth.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toSet());
        }

        MDC.put("requestId", requestId);
        MDC.put("correlationId", correlationId);
        if (userId != null)
            MDC.put("userId", userId);

        // expose request id to response
        response.setHeader("X-Request-Id", requestId);
        response.setHeader("X-Correlation-Id", correlationId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            if (shouldAudit(request, roles)) {
                logger.info("ADMIN_AUDIT method={} path={} status={} actor={} roles={}",
                        request.getMethod(),
                        request.getRequestURI(),
                        response.getStatus(),
                        userId == null ? "anonymous" : userId,
                        roles);
            }
            MDC.remove("requestId");
            MDC.remove("correlationId");
            MDC.remove("userId");
        }
    }

    private boolean shouldAudit(HttpServletRequest request, Set<String> roles) {
        String method = request.getMethod() == null ? "" : request.getMethod().toUpperCase(Locale.ROOT);
        if (!AUDIT_METHODS.contains(method)) {
            return false;
        }
        String path = request.getRequestURI() == null ? "" : request.getRequestURI();
        boolean adminRoute = path.startsWith("/admin")
                || path.startsWith("/super-admin")
                || path.startsWith("/api/admin")
                || path.startsWith("/api/super-admin");
        boolean privilegedActor = roles.contains("ROLE_ADMIN") || roles.contains("ROLE_SUPER_ADMIN");
        return adminRoute || privilegedActor;
    }
}
