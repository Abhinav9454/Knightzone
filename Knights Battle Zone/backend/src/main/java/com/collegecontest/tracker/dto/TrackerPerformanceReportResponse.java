package com.collegecontest.tracker.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TrackerPerformanceReportResponse {
    private TrackerSummaryResponse summary;
    private TrackerInsightResponse weeklyInsight;
    private TrackerSkillGapResponse skillGap;
    private LocalDateTime generatedAt;
}

