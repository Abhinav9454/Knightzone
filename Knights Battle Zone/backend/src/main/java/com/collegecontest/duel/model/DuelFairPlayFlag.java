package com.collegecontest.duel.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "duel_fair_play_flags", indexes = {
        @Index(name = "idx_duel_flag_duel", columnList = "duel_id"),
        @Index(name = "idx_duel_flag_reported_user", columnList = "reported_user_id"),
        @Index(name = "idx_duel_flag_status", columnList = "status"),
        @Index(name = "idx_duel_flag_created", columnList = "created_at")
})
@Data
public class DuelFairPlayFlag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "duel_id", nullable = false)
    private Long duelId;

    @Column(name = "reporter_user_id", nullable = false)
    private Long reporterUserId;

    @Column(name = "reported_user_id", nullable = false)
    private Long reportedUserId;

    @Column(name = "flag_type", nullable = false, length = 40)
    private String flagType;

    @Column(nullable = false, length = 16)
    private String severity;

    @Column(nullable = false, length = 240)
    private String reason;

    @Column(name = "analysis_details", length = 1200)
    private String analysisDetails;

    @Column(nullable = false, length = 24)
    private String status = "OPEN";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null || status.isBlank()) {
            status = "OPEN";
        }
    }
}
