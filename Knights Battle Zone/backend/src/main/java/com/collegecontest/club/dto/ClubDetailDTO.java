package com.collegecontest.club.dto;

import com.collegecontest.club.model.ClubMemberRole;
import com.collegecontest.club.model.ClubVisibility;

import java.time.LocalDateTime;

public record ClubDetailDTO(
        Long id,
        String name,
        String description,
        ClubVisibility visibility,
        Long ownerId,
        String ownerName,
        long memberCount,
        boolean joined,
        ClubMemberRole myRole,
        LocalDateTime createdAt
) {}
