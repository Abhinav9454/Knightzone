package com.collegecontest.duel.dto;

import lombok.Data;

@Data
public class DuelMatchmakingRequest {
    private String mode;
    private String difficulty;
    private Integer durationSeconds;
    private Integer maxRatingGap;
}
