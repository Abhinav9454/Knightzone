package com.collegecontest.dto;

public enum LeaderboardTimeRange {
    TODAY,
    WEEK,
    ALL_TIME;

    public static LeaderboardTimeRange fromQuery(String raw) {
        if (raw == null || raw.isBlank()) {
            return ALL_TIME;
        }

        return switch (raw.trim().toLowerCase()) {
            case "today" -> TODAY;
            case "week", "weekly", "this-week" -> WEEK;
            default -> ALL_TIME;
        };
    }
}
