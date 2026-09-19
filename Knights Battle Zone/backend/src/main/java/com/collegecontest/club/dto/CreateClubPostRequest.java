package com.collegecontest.club.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateClubPostRequest(
        @NotBlank @Size(max = 160) String title,
        @NotBlank @Size(max = 4000) String content
) {}
