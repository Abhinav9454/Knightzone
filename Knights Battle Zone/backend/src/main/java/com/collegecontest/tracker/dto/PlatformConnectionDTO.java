package com.collegecontest.tracker.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PlatformConnectionDTO {
    private Long id;
    private String platform;
    private String username;
    private LocalDateTime lastFetchedAt;
    private LocalDateTime connectedAt;
}

