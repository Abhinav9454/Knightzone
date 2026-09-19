package com.collegecontest.duel.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DuelMatchQualityDTO {
    private String mode;
    private String difficulty;
    private Integer durationSeconds;
    private Integer userRating;
    private Integer maxRatingGap;
    private Integer recommendedRatingGap;
    private Integer queuePoolSize;
    private Integer estimatedWaitSeconds;
    private String rankDecayRisk;
}
