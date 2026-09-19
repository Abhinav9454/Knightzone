package com.collegecontest.duel.dto;

import lombok.Data;

@Data
public class DuelCreateRequest {
    private Long opponentId;
    private String mode;
    private String difficulty;
    private Integer durationSeconds;
}
