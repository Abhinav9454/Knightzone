package com.collegecontest.typing.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "typing_test_results", indexes = {
        @Index(name = "idx_typing_results_user", columnList = "user_id"),
        @Index(name = "idx_typing_results_mode_created", columnList = "mode, created_at"),
        @Index(name = "idx_typing_results_created", columnList = "created_at")
})
@Data
public class TypingTestResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 24)
    private String mode;

    @Column(nullable = false)
    private Integer wpm;

    @Column(nullable = false)
    private Double accuracy;

    @Column(nullable = false)
    private Integer errors;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "word_count_target")
    private Integer wordCountTarget;

    @Column(length = 80)
    private String category;

    @Column(name = "text_snippet", length = 400)
    private String textSnippet;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
