package com.collegecontest.club.dto;

import com.collegecontest.club.model.ClubVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateClubRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 2000) String description,
        ClubVisibility visibility
) {}
