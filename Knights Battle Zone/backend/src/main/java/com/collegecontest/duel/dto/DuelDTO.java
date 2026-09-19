package com.collegecontest.duel.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DuelDTO {
    private Long id;
    private Long challengerId;
    private String challengerName;
    private Long opponentId;
    private String opponentName;
    private String status;
    private Long problemId;
    private String problemTitle;
    private String mode;
    private String difficulty;
    private Integer durationSeconds;
    private String inviteCode;
    private Double player1Score;
    private Double player2Score;
    private Boolean player1Completed;
    private Boolean player2Completed;
    private Integer player1RatingBefore;
    private Integer player2RatingBefore;
    private Integer player1RatingAfter;
    private Integer player2RatingAfter;
    private Long remainingSeconds;
    private Long winnerId;
    private String winner;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
