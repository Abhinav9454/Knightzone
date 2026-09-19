package com.collegecontest.mockinterview.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OverallInterviewAnalyticsDTO {
    private long totalUsers;
    private long totalInterviews;
    private long scheduledInterviews;
    private long inProgressInterviews;
    private long completedInterviews;
    private double averageOverallScore;
}
