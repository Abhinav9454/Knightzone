package com.collegecontest.judge.service;

import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class JudgeStatusResolver {

    public String normalizeExecutionStatus(String status) {
        if (status == null) {
            return "ERROR";
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "ACCEPTED", "SUCCESS" -> "ACCEPTED";
            case "TIME_LIMIT", "TIMEOUT" -> "TIME_LIMIT";
            case "COMPILE_ERROR" -> "COMPILE_ERROR";
            case "RUNTIME_ERROR", "ERROR" -> "RUNTIME_ERROR";
            case "WRONG_ANSWER", "FAILED" -> "FAILED";
            default -> normalized;
        };
    }

    public String prioritizeStatus(String current, String candidate) {
        String normalizedCurrent = normalizeExecutionStatus(current);
        String normalizedCandidate = normalizeExecutionStatus(candidate);
        return severity(normalizedCandidate) > severity(normalizedCurrent)
                ? normalizedCandidate
                : normalizedCurrent;
    }

    private int severity(String status) {
        return switch (status) {
            case "ACCEPTED" -> 0;
            case "FAILED" -> 1;
            case "RUNTIME_ERROR" -> 2;
            case "TIME_LIMIT" -> 3;
            case "COMPILE_ERROR" -> 4;
            default -> 2;
        };
    }
}

