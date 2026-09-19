package com.collegecontest.club.dto;

import com.collegecontest.club.model.ClubChallengeFrequency;
import com.collegecontest.club.model.ClubChallengeStatus;

import java.time.LocalDateTime;

public record ClubChallengeDTO(
        Long id,
        Long clubId,
        String title,
        String description,
        ClubChallengeFrequency frequency,
        ClubChallengeStatus status,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        LocalDateTime createdAt
) {}
