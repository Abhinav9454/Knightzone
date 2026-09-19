package com.collegecontest.club.dto;

import com.collegecontest.club.model.ClubChallengeFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record CreateClubChallengeRequest(
        @NotBlank @Size(max = 160) String title,
        @Size(max = 2000) String description,
        @NotNull ClubChallengeFrequency frequency,
        @NotNull LocalDateTime startsAt,
        @NotNull LocalDateTime endsAt
) {}
