package com.collegecontest.tracker.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PlatformSyncResponse {
    private String platform;
    private boolean success;
    private String message;
    private int fetchedItems;
    private int newItems;
    private int fetchedRepositories;
    private LocalDateTime updatedAt;
}

