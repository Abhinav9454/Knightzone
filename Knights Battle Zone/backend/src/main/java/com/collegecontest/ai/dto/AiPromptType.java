package com.collegecontest.ai.dto;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Locale;

public enum AiPromptType {
    CODE_REVIEWER,
    PROBLEM_GENERATOR,
    INTERVIEWER;

    @JsonCreator
    public static AiPromptType fromValue(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String normalized = raw.trim()
                .replace('-', '_')
                .replace(' ', '_')
                .toUpperCase(Locale.ROOT);
        return AiPromptType.valueOf(normalized);
    }
}
