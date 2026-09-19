package com.collegecontest.marketplace.dto;

import com.collegecontest.marketplace.model.PassageModerationStatus;

import java.time.LocalDateTime;

public record PassageModerationAuditDTO(
        Long id,
        Long moderationId,
        Long passageId,
        String passageTitle,
        Long reviewerId,
        String reviewerName,
        String decision,
        PassageModerationStatus previousStatus,
        PassageModerationStatus nextStatus,
        String reviewNotes,
        boolean featuredAfterDecision,
        LocalDateTime createdAt
) {
}
