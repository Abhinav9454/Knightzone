package com.collegecontest.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "submissions",
        indexes = {
                @Index(name = "idx_sub_problem_status_time", columnList = "problem_id,status,submitted_at,id"),
                @Index(name = "idx_sub_user_status", columnList = "user_id,status"),
                @Index(name = "idx_sub_user_time", columnList = "user_id,submitted_at"),
                @Index(name = "idx_sub_status_time_problem_user", columnList = "status,submitted_at,problem_id,user_id")
        }
)
@Data
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private Problem problem;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String code;

    @Column(nullable = false)
    private String language;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String output;

    @Column(name = "judge_submission_id", length = 80)
    private String judgeSubmissionId;

    private Integer executionTime;

    @Column(name = "time_taken_seconds")
    private Integer timeTakenSeconds;

    @Column(name = "upset_multiplier")
    private Double upsetMultiplier;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "readability_score")
    private Double readabilityScore;

    @Column(name = "time_complexity")
    private String timeComplexity;

    @Column(name = "space_complexity")
    private String spaceComplexity;
}
