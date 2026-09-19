package com.collegecontest.judge.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Component
public class SecurityStartupValidator {

    private static final Set<String> INSECURE_TOKENS = Set.of(
            "change_me",
            "default_change_me",
            "judge-default-token-change-me");

    private final Environment environment;

    @Value("${judge.auth.token:}")
    private String judgeInternalToken;

    @Value("${app.security.allow-dev-profile:false}")
    private boolean allowDevProfile;

    public SecurityStartupValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validate() {
        if (environment.acceptsProfiles(Profiles.of("test"))) {
            return;
        }

        String[] activeProfiles = environment.getActiveProfiles();
        if (activeProfiles.length == 0) {
            throw new IllegalStateException(
                    "Security startup validation failed: No active Spring profile configured.");
        }

        Set<String> active = new HashSet<>();
        Arrays.stream(activeProfiles).forEach(profile -> active.add(profile.toLowerCase()));
        if (active.contains("dev") && !allowDevProfile) {
            throw new IllegalStateException(
                    "Security startup validation failed: dev profile is active while app.security.allow-dev-profile=false.");
        }

        if (isInvalidToken(judgeInternalToken)) {
            throw new IllegalStateException(
                    "Security startup validation failed: judge.auth.token is missing/weak or uses insecure fallback.");
        }
    }

    private boolean isInvalidToken(String token) {
        if (token == null) {
            return true;
        }
        String normalized = token.trim();
        if (normalized.isBlank()) {
            return true;
        }
        if (normalized.length() < 32) {
            return true;
        }
        return INSECURE_TOKENS.contains(normalized);
    }
}
