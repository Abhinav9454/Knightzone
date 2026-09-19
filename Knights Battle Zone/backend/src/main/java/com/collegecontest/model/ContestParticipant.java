package com.collegecontest.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "contest_participants",
        indexes = {
                @Index(name = "idx_cp_user", columnList = "user_id")
        }
)
@IdClass(ContestParticipantId.class)
@Data
public class ContestParticipant {

    @Id
    @Column(name = "contest_id")
    private Long contestId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "eliminated", nullable = false)
    private Boolean eliminated = false;

    @Column(name = "total_score")
    private Double totalScore = 0.0;

    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    @Column(name = "attempt_start_time")
    private LocalDateTime attemptStartTime;

    @Column(name = "attempt_end_time")
    private LocalDateTime attemptEndTime;
}
