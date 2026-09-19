package com.collegecontest.tracker.model;

import java.util.Locale;

public enum TrackerPlatform {
    LEETCODE,
    CODEFORCES,
    GITHUB,
    GEEKSFORGEEKS,
    HACKERRANK;

    public static TrackerPlatform from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Platform is required");
        }
        return TrackerPlatform.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}

