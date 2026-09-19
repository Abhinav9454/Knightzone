package com.collegecontest.tracker.service;

import com.collegecontest.tracker.dto.TrackerPerformanceReportResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional(readOnly = true)
public class TrackerReportService {
    private final TrackerSummaryService trackerSummaryService;
    private final TrackerInsightService trackerInsightService;
    private final TrackerSkillGapService trackerSkillGapService;

    public TrackerReportService(
            TrackerSummaryService trackerSummaryService,
            TrackerInsightService trackerInsightService,
            TrackerSkillGapService trackerSkillGapService) {
        this.trackerSummaryService = trackerSummaryService;
        this.trackerInsightService = trackerInsightService;
        this.trackerSkillGapService = trackerSkillGapService;
    }

    public TrackerPerformanceReportResponse generateReport(Long userId, String targetRole, boolean useAi) {
        return TrackerPerformanceReportResponse.builder()
                .summary(trackerSummaryService.getSummary(userId))
                .weeklyInsight(trackerInsightService.weeklyInsight(userId, useAi))
                .skillGap(trackerSkillGapService.getSkillGap(userId, targetRole, useAi))
                .generatedAt(LocalDateTime.now())
                .build();
    }
}

