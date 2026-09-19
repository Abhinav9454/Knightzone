package com.collegecontest.marketplace.dto;

import com.collegecontest.marketplace.model.PassageStatus;

import java.time.LocalDateTime;
import java.util.List;

public record PassageDTO(
        Long id,
        String title,
        String preview,
        String content,
        String syntaxMode,
        List<String> tags,
        Long authorId,
        String authorName,
        boolean featured,
        boolean approved,
        PassageStatus status,
        double averageRating,
        long ratingCount,
        long playCount,
        double completionRate,
        boolean bookmarked,
        Integer myRating,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

