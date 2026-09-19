package com.collegecontest.marketplace.dto;

import com.collegecontest.marketplace.model.PassageModerationStatus;

import java.time.LocalDateTime;

public record PassageModerationDTO(
        Long id,
        Long passageId,
        String passageTitle,
        Long reporterId,
        String reporterName,
        String reason,
        PassageModerationStatus status,
        String reviewNotes,
        Long reviewerId,
        String reviewerName,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt
) {
}

