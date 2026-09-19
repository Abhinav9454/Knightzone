package com.collegecontest.speed.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ParticipantScoreDTO {
    private Long userId;
    private Double totalScore;
}
