package com.collegecontest.badge.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserBadgeDTO {
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private LocalDateTime awardedAt;
}
