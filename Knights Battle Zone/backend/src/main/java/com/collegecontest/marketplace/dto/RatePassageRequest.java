package com.collegecontest.marketplace.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RatePassageRequest(
        @NotNull @Min(1) @Max(5) Integer rating,
        Boolean completed
) {
}

