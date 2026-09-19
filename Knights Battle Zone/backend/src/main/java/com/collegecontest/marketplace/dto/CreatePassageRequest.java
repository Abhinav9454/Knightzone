package com.collegecontest.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreatePassageRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank @Size(max = 8000) String content,
        @Size(max = 40) String syntaxMode,
        List<@Size(max = 50) String> tags,
        Boolean featured
) {
}

