package com.collegecontest.club.dto;

import java.time.LocalDateTime;

public record ClubPostDTO(
        Long id,
        Long clubId,
        Long authorId,
        String authorName,
        String title,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
