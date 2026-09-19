package com.collegecontest.club.dto;

public record ClubRankingEntryDTO(
        Long userId,
        String userName,
        double totalPoints,
        double bestWpm,
        double bestAccuracy
) {}
