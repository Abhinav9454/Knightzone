package com.collegecontest.badge.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BadgeDTO {
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
}
