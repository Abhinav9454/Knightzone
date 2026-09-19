package com.collegecontest.ai.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AiUsageResponse {
    private boolean allowed;
    private String message;
    private String data;
    private Long remainingHours;
    private Long remainingMinutes;
    private LocalDateTime nextAvailableAt;
    private String promptType;
}
