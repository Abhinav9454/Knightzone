package com.collegecontest.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LeaderboardFilterParams {
    private String region;
    private String country;
    private String college;
    private String department;
    private String mode;
    private String difficulty;
    private LeaderboardTimeRange timeRange;
}
