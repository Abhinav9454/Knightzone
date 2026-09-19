package com.collegecontest.club.dto;

import java.time.LocalDateTime;

public record ClubMessageDTO(
        Long id,
        Long clubId,
        Long senderId,
        String senderName,
        String message,
        LocalDateTime createdAt
) {}
