package com.collegecontest.mockinterview;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "interviewer_id")
    private Long interviewerId;

    @Column(name = "interviewer_name")
    private String interviewerName;

    @Column(name = "session_id", nullable = false, unique = true, length = 32)
    private String sessionId;

    @Column(name = "scheduled_time")
    private LocalDateTime scheduledTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "interview_type", length = 32)
    private String interviewType; // TECHNICAL, BEHAVIORAL, HR, CUSTOM

    @Column(name = "mode", length = 32)
    private String mode; // AI, PEER, EXPERT

    @Column(name = "difficulty", length = 32)
    private String difficulty; // BEGINNER, INTERMEDIATE, ADVANCED

    @Column(name = "topics", columnDefinition = "TEXT")
    private String topics;

    @Column(name = "meeting_link")
    private String meetingLink;

    @Column(name = "question_data", columnDefinition = "LONGTEXT")
    private String questionData;

    @Column(name = "strict_mode")
    private Boolean strictMode;

    @Column(name = "negative_marking")
    private Boolean negativeMarking;

    @Column(name = "mastery_track_id", length = 80)
    private String masteryTrackId;

    @Column(name = "mastery_track_title", length = 180)
    private String masteryTrackTitle;

    @Column(name = "overall_score")
    private Double overallScore;

    @Column(name = "technical_score")
    private Double technicalScore;

    @Column(name = "communication_score")
    private Double communicationScore;

    @Column(name = "problem_solving_score")
    private Double problemSolvingScore;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "strengths", columnDefinition = "TEXT")
    private String strengths;

    @Column(name = "weaknesses", columnDefinition = "TEXT")
    private String weaknesses;

    @Column(name = "recommendations", columnDefinition = "TEXT")
    private String recommendations;

    @Column(name = "certificate_url")
    private String certificateUrl;

    @Column(name = "chat_transcript", columnDefinition = "TEXT")
    private String chatTranscript;

    @Column(name = "status")
    private String status; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "recording_url")
    private String recordingUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
        if (this.status == null)
            this.status = "SCHEDULED";
        if (this.interviewType == null)
            this.interviewType = "TECHNICAL";
        if (this.mode == null)
            this.mode = "AI";
        if (this.difficulty == null)
            this.difficulty = "INTERMEDIATE";
        if (this.strictMode == null)
            this.strictMode = Boolean.FALSE;
        if (this.negativeMarking == null)
            this.negativeMarking = Boolean.FALSE;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
