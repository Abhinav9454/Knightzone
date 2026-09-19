package com.collegecontest.mockinterview;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "interview_mastery_progress",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_mastery_user_track", columnNames = {"user_id", "track_id"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewMasteryProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "track_id", nullable = false, length = 80)
    private String trackId;

    @Column(name = "track_title", length = 180)
    private String trackTitle;

    @Column(name = "interview_type", length = 32)
    private String interviewType;

    @Column(name = "difficulty", length = 32)
    private String difficulty;

    @Column(name = "question_format", length = 32)
    private String questionFormat;

    @Column(name = "topics", columnDefinition = "TEXT")
    private String topics;

    @Column(name = "target_company", length = 120)
    private String targetCompany;

    @Column(name = "weekly_goal", columnDefinition = "TEXT")
    private String weeklyGoal;

    @Column(name = "planned_sprints_per_week")
    private Integer plannedSprintsPerWeek;

    @Column(name = "completed_sprints")
    private Integer completedSprints;

    @Column(name = "total_sessions_completed")
    private Integer totalSessionsCompleted;

    @Column(name = "current_week")
    private Integer currentWeek;

    @Column(name = "readiness_score")
    private Double readinessScore;

    @Column(name = "last_session_score")
    private Double lastSessionScore;

    @Column(name = "strict_mode")
    private Boolean strictMode;

    @Column(name = "negative_marking")
    private Boolean negativeMarking;

    @Column(name = "status", length = 32)
    private String status;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.lastSyncedAt == null) {
            this.lastSyncedAt = now;
        }
        if (this.currentWeek == null || this.currentWeek <= 0) {
            this.currentWeek = 1;
        }
        if (this.plannedSprintsPerWeek == null || this.plannedSprintsPerWeek <= 0) {
            this.plannedSprintsPerWeek = 5;
        }
        if (this.completedSprints == null || this.completedSprints < 0) {
            this.completedSprints = 0;
        }
        if (this.totalSessionsCompleted == null || this.totalSessionsCompleted < 0) {
            this.totalSessionsCompleted = 0;
        }
        if (this.strictMode == null) {
            this.strictMode = Boolean.TRUE;
        }
        if (this.negativeMarking == null) {
            this.negativeMarking = Boolean.TRUE;
        }
        if (this.status == null || this.status.isBlank()) {
            this.status = "ON_TRACK";
        }
    }

    @PreUpdate
    public void preUpdate() {
        LocalDateTime now = LocalDateTime.now();
        this.updatedAt = now;
        this.lastSyncedAt = now;
    }
}
