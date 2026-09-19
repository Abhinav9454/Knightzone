package com.collegecontest.intercollege.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CollegeRankingDTO {
    private String college;
    private Double totalPoints;
    private Integer memberCount;
    private Integer contestsWon;
    private Integer rank;
}

