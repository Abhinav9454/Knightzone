package com.collegecontest.typing.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "typing_best_scores", uniqueConstraints = {
        @UniqueConstraint(name = "uk_typing_best_user", columnNames = { "user_id" })
})
@Data
public class TypingBestScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "best_wpm", nullable = false)
    private Integer bestWpm = 0;

    @Column(name = "best_accuracy", nullable = false)
    private Double bestAccuracy = 0.0;

    @Column(name = "best_raw_wpm", nullable = false)
    private Integer bestRawWpm = 0;

    @Column(name = "best_errors", nullable = false)
    private Integer bestErrors = 0;

    @Column(name = "best_duration", nullable = false)
    private Integer bestDuration = 0;

    @Column(name = "best_text_id")
    private Long bestTextId;

    @Column(name = "best_achieved_at")
    private LocalDateTime bestAchievedAt;

    @Column(name = "total_tests", nullable = false)
    private Integer totalTests = 0;

    @Column(name = "total_practice_seconds", nullable = false)
    private Integer totalPracticeSeconds = 0;

    @Column(name = "xp", nullable = false)
    private Integer xp = 0;

    @Column(name = "level_value", nullable = false)
    private Integer levelValue = 1;

    @Column(name = "streak_days", nullable = false)
    private Integer streakDays = 0;

    @Column(name = "last_test_date")
    private LocalDate lastTestDate;

    @Column(name = "badges_json", columnDefinition = "TEXT")
    private String badgesJson;

    @Column(name = "heatmap_json", columnDefinition = "TEXT")
    private String heatmapJson;
}

