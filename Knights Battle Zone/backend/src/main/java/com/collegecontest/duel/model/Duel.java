package com.collegecontest.duel.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "duels")
@Data
public class Duel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "duel_date", nullable = false)
    private LocalDate duelDate;

    @Column(name = "user1_id", nullable = false)
    private Long user1Id;

    @Column(name = "user2_id", nullable = false)
    private Long user2Id;

    @Column(name = "problem_id", nullable = false)
    private Long problemId;

    @Column(name = "mode", nullable = false)
    private String mode;

    @Column(name = "difficulty", nullable = false)
    private String difficulty;

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds;

    @Column(name = "invite_code")
    private String inviteCode;

    @Column(name = "player1_score")
    private Double player1Score;

    @Column(name = "player2_score")
    private Double player2Score;

    @Column(name = "player1_completed", nullable = false)
    private Boolean player1Completed = false;

    @Column(name = "player2_completed", nullable = false)
    private Boolean player2Completed = false;

    @Column(name = "player1_rating_before")
    private Integer player1RatingBefore;

    @Column(name = "player2_rating_before")
    private Integer player2RatingBefore;

    @Column(name = "player1_rating_after")
    private Integer player1RatingAfter;

    @Column(name = "player2_rating_after")
    private Integer player2RatingAfter;

    @Lob
    @Column(name = "game_data")
    private String gameData;

    @Column(name = "winner_id")
    private Long winnerId;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (mode == null || mode.isBlank()) {
            mode = "CODING";
        }
        if (difficulty == null || difficulty.isBlank()) {
            difficulty = "ANY";
        }
        if (durationSeconds == null || durationSeconds <= 0) {
            durationSeconds = 300;
        }
        if (player1Completed == null) {
            player1Completed = false;
        }
        if (player2Completed == null) {
            player2Completed = false;
        }
    }
}
