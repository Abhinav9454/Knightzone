package com.collegecontest.plagiarism.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "plagiarism_flags")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlagiarismFlag {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id_1", nullable = false)
    private Long submissionId1;

    @Column(name = "submission_id_2", nullable = false)
    private Long submissionId2;

    @Column(name = "similarity_score", nullable = false)
    private Double similarityScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(name = "contest_id")
    private Long contestId;

    @Column(length = 500)
    private String resolution;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public enum Status {
        PENDING,
        REVIEWED,
        RESOLVED,
        FALSE_POSITIVE
    }
}
