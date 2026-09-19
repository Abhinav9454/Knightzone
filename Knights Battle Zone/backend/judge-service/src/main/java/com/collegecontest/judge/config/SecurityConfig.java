package com.collegecontest.judge.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${judge.auth.token}")
    private String judgeAuthToken;

    private final CorsOriginProperties corsOriginProperties;

    public SecurityConfig(CorsOriginProperties corsOriginProperties) {
        this.corsOriginProperties = corsOriginProperties;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration cfg = new CorsConfiguration();
                    cfg.setAllowedOrigins(corsOriginProperties.asList());
                    cfg.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    cfg.setAllowedHeaders(java.util.List.of("Content-Type", "Accept", "X-Judge-Token"));
                    cfg.setAllowCredentials(false);
                    return cfg;
                }))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/health", "/actuator/health").permitAll()
                        .anyRequest().access((authentication, context) -> new AuthorizationDecision(
                                hasValidInternalToken(context.getRequest()))))
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }

    private boolean hasValidInternalToken(HttpServletRequest request) {
        String provided = request.getHeader("X-Judge-Token");
        if (provided == null || provided.isBlank() || judgeAuthToken == null || judgeAuthToken.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(
                provided.getBytes(StandardCharsets.UTF_8),
                judgeAuthToken.getBytes(StandardCharsets.UTF_8));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
