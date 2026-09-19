package com.collegecontest.club.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record MuteMemberRequest(
        @Min(1) @Max(10080) int minutes
) {}
