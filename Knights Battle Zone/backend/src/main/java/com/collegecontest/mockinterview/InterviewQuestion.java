package com.collegecontest.mockinterview;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "interview_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String type; // TECHNICAL, BEHAVIORAL, HR, CUSTOM

    @Column(nullable = false, length = 32)
    private String difficulty; // BEGINNER, INTERMEDIATE, ADVANCED

    @Column(nullable = false, length = 120)
    private String category;

    @Column(name = "question_format", nullable = false, length = 32)
    private String questionFormat = "OPEN_ENDED"; // OPEN_ENDED, MCQ, CODING

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(name = "options_json", columnDefinition = "LONGTEXT")
    private String optionsJson; // JSON array for MCQ options

    @Column(name = "correct_answer", columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "expected_complexity", length = 64)
    private String expectedComplexity;

    @Column(name = "company_tag", length = 120)
    private String companyTag;

    @Column(name = "estimated_seconds")
    private Integer estimatedSeconds;

    @Column(name = "expected_points", columnDefinition = "TEXT")
    private String expectedPoints;

    @Column(name = "evaluation_criteria", columnDefinition = "TEXT")
    private String aiEvaluationCriteria;

    @Column(length = 500)
    private String tags;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (isActive == null) {
            isActive = true;
        }
        if (questionFormat == null || questionFormat.isBlank()) {
            questionFormat = "OPEN_ENDED";
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
