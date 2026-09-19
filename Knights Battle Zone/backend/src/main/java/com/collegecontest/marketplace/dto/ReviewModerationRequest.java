package com.collegecontest.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewModerationRequest(
        @NotBlank String decision,
        @Size(max = 1200) String notes,
        Boolean featured
) {
}

