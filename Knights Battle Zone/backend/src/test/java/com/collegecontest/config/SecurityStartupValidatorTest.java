package com.collegecontest.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SecurityStartupValidatorTest {

    @Test
    void validateSecurityConfigFailsForWeakSecretsOutsideTestProfile() {
        SecurityStartupValidator validator = new SecurityStartupValidator(new MockEnvironment().withProperty("spring.profiles.active", "dev"));
        ReflectionTestUtils.setField(validator, "jwtSecret", "default_change_me");
        ReflectionTestUtils.setField(validator, "trackerTokenSecret", "tracker-default-secret-change-me");
        ReflectionTestUtils.setField(validator, "judgeInternalToken", "change_me");

        assertThrows(IllegalStateException.class, validator::validateSecurityConfig);
    }

    @Test
    void validateSecurityConfigPassesForStrongSecretsOutsideTestProfile() {
        SecurityStartupValidator validator = new SecurityStartupValidator(new MockEnvironment().withProperty("spring.profiles.active", "prod"));
        ReflectionTestUtils.setField(validator, "jwtSecret", "JwtSecretForTestsMustBeLongEnough1234567890");
        ReflectionTestUtils.setField(validator, "trackerTokenSecret", "TrackerSecretForTestsMustBeLongEnough1234567890");
        ReflectionTestUtils.setField(validator, "judgeInternalToken", "JudgeInternalTokenForTestsLongEnough123456");

        assertDoesNotThrow(validator::validateSecurityConfig);
    }

    @Test
    void validateSecurityConfigIsSkippedForTestProfile() {
        SecurityStartupValidator validator = new SecurityStartupValidator(new MockEnvironment().withProperty("spring.profiles.active", "test"));
        ReflectionTestUtils.setField(validator, "jwtSecret", "short");
        ReflectionTestUtils.setField(validator, "trackerTokenSecret", "");
        ReflectionTestUtils.setField(validator, "judgeInternalToken", "");

        assertDoesNotThrow(validator::validateSecurityConfig);
    }
}

