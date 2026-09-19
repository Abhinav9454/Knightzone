package com.collegecontest.club.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateClubMessageRequest(
        @NotBlank @Size(max = 2000) String message
) {}
