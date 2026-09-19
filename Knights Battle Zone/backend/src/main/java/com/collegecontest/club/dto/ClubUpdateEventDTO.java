package com.collegecontest.club.dto;

import java.time.LocalDateTime;

public record ClubUpdateEventDTO(
        String type,
        String message,
        Long clubId,
        LocalDateTime at
) {}
