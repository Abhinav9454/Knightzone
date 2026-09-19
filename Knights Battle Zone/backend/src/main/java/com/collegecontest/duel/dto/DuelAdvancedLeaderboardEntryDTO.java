package com.collegecontest.duel.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DuelAdvancedLeaderboardEntryDTO {
    private Long userId;
    private String username;
    private Integer rating;
    private Integer effectiveRating;
    private Long wins;
    private Long losses;
    private Long totalDuels;
    private Integer winRate;
    private Long inactiveDays;
    private Integer rankDecayPenalty;
    private String skillTier;
}
