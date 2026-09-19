package com.collegecontest.club.dto;

import com.collegecontest.club.model.ClubMemberRole;
import com.collegecontest.club.model.ClubVisibility;

public record ClubSummaryDTO(
        Long id,
        String name,
        String description,
        ClubVisibility visibility,
        long memberCount,
        boolean joined,
        ClubMemberRole myRole
) {}
