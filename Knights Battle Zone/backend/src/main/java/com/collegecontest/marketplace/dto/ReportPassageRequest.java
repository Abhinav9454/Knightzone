package com.collegecontest.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReportPassageRequest(
        @NotBlank @Size(max = 1200) String reason
) {
}

