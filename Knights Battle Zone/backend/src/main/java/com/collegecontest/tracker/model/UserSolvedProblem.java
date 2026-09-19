package com.collegecontest.tracker.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_solved_problems", indexes = {
        @Index(name = "idx_solved_user", columnList = "user_id"),
        @Index(name = "idx_solved_platform", columnList = "platform"),
        @Index(name = "idx_solved_difficulty", columnList = "difficulty"),
        @Index(name = "idx_solved_solved_at", columnList = "solved_at")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_platform_problem", columnNames = { "user_id", "platform", "problem_id" })
})
@Data
public class UserSolvedProblem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TrackerPlatform platform;

    @Column(name = "problem_id", nullable = false, length = 255)
    private String problemId;

    @Column(name = "problem_name", nullable = false, length = 500)
    private String problemName;

    @Column(name = "problem_url", length = 1000)
    private String problemUrl;

    @Column(length = 20)
    private String difficulty;

    @Column(name = "topic_tags", columnDefinition = "TEXT")
    private String topicTags;

    @Column(name = "solved_at")
    private LocalDateTime solvedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (solvedAt == null) {
            solvedAt = now;
        }
        if (createdAt == null) {
            createdAt = now;
        }
    }
}

