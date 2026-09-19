package com.collegecontest.duel.dto;

import lombok.Data;

@Data
public class DuelSubmitRequest {
    private Double score;
    private Boolean completed;
    private String gameData;
}
