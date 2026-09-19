package com.collegecontest.suspicious.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "suspicious_activities")
@Data
public class SuspiciousActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "contest_id", nullable = false)
    private Long contestId;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private Double score;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private Boolean resolved = false;
}
