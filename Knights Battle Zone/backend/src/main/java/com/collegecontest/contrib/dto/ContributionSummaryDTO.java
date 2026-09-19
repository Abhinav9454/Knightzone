package com.collegecontest.contrib.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContributionSummaryDTO {
    private Long userId;
    private Integer totalPoints;
    private Integer totalContributions;
    private Integer pointsLast30Days;
    private Integer contributionsLast30Days;
    private Integer currentStreakDays;
    private String badgeLevel;
    private String bestType;
    private LocalDateTime lastContributionAt;
    private List<ContributionTypeStatDTO> typeBreakdown;
}
