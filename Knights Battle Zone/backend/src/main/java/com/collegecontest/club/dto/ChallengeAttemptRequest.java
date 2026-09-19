package com.collegecontest.club.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record ChallengeAttemptRequest(
        @Min(1) @Max(400) double wpm,
        @Min(1) @Max(100) double accuracy
) {}
