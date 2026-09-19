package com.collegecontest.mockinterview.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserInterviewAnalyticsDTO {
    private Long userId;
    private long totalInterviews;
    private long completedInterviews;
    private double averageScore;
    private double technicalAverage;
    private double communicationAverage;
    private double problemSolvingAverage;
    private double confidenceAverage;
    private String strongestArea;
    private String weakestArea;
}
