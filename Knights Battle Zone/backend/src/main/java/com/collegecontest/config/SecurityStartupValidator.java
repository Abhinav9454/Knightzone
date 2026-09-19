package com.collegecontest.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Component
public class SecurityStartupValidator {

    private static final Logger logger = LoggerFactory.getLogger(SecurityStartupValidator.class);

    private static final Set<String> INSECURE_JWT_SECRETS = Set.of(
            "default_change_me",
            "mysupersecuresecretkeythatmustbeatleast32charslong",
            "dev_only_change_me_at_least_32_characters_long");
    private static final Set<String> INSECURE_TRACKER_SECRETS = Set.of(
            "tracker-default-secret-change-me",
            "default_change_me",
            "change_me");
    private static final Set<String> INSECURE_JUDGE_TOKENS = Set.of(
            "change_me",
            "default_change_me",
            "judge-default-token-change-me");

    private final Environment environment;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${tracker.token.secret:}")
    private String trackerTokenSecret;

    @Value("${judge.auth.token:}")
    private String judgeInternalToken;

    @Value("${app.security.allow-dev-profile:false}")
    private boolean allowDevProfile;

    public SecurityStartupValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validateSecurityConfig() {
        if (environment.acceptsProfiles(Profiles.of("test"))) {
            logger.info("Security secret strict validation is skipped for test profile.");
            return;
        }

        List<String> violations = new ArrayList<>();
        String[] activeProfiles = environment.getActiveProfiles();
        if (activeProfiles.length == 0) {
            violations.add("No active Spring profile configured. Set SPRING_PROFILES_ACTIVE explicitly.");
        }
        boolean hasDevProfile = Arrays.stream(activeProfiles).anyMatch("dev"::equalsIgnoreCase);
        if (hasDevProfile && !allowDevProfile) {
            violations.add("dev profile is active while app.security.allow-dev-profile=false.");
        }
        if (isInvalidSecret(jwtSecret, INSECURE_JWT_SECRETS, 32)) {
            violations.add("jwt.secret is missing/weak or uses known insecure fallback.");
        }
        if (isInvalidSecret(trackerTokenSecret, INSECURE_TRACKER_SECRETS, 32)) {
            violations.add("tracker.token.secret is missing/weak or uses insecure fallback.");
        }
        if (isInvalidSecret(judgeInternalToken, INSECURE_JUDGE_TOKENS, 32)) {
            violations.add("judge.auth.token is missing/weak or uses insecure fallback.");
        }

        if (!violations.isEmpty()) {
            String message = "Security startup validation failed: " + String.join(" ", violations);
            throw new IllegalStateException(message);
        }
    }

    private boolean isInvalidSecret(String value, Set<String> insecureValues, int minLength) {
        if (value == null) {
            return true;
        }
        String normalized = value.trim();
        if (normalized.isBlank()) {
            return true;
        }
        if (normalized.length() < minLength) {
            return true;
        }
        return insecureValues.contains(normalized);
    }
}
