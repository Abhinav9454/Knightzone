package com.collegecontest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntry {
    private int rank;
    private Long userId;
    private String name;
    private String college;
    private int solved;
    private int totalPoints;
    private LocalDateTime firstAcceptedAt;
}
