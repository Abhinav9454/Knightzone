package com.collegecontest.mockinterview.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MasteryTrackProgressResponse {
    private Long id;
    private Long userId;
    private String trackId;
    private String trackTitle;
    private String interviewType;
    private String difficulty;
    private String questionFormat;
    private String topics;
    private String targetCompany;
    private String weeklyGoal;
    private Integer plannedSprintsPerWeek;
    private Integer completedSprints;
    private Integer totalSessionsCompleted;
    private Integer currentWeek;
    private Double readinessScore;
    private Double lastSessionScore;
    private Boolean strictMode;
    private Boolean negativeMarking;
    private String status;
    private Double completionPercent;
    private LocalDateTime lastSyncedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
