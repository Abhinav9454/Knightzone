package com.collegecontest.duel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DuelLeaderboardEntryDTO {
    private Long userId;
    private String username;
    private Integer rating;
    private long wins;
    private long losses;
    private long totalDuels;
}
