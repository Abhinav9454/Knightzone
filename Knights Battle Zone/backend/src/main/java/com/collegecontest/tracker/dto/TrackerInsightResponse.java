package com.collegecontest.tracker.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TrackerInsightResponse {
    private String summary;
    private List<String> recommendations;
    private boolean aiGenerated;
    private LocalDateTime generatedAt;
}

