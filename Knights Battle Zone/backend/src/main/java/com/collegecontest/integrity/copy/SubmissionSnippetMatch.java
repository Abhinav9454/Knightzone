package com.collegecontest.integrity.copy;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "submission_snippet_matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionSnippetMatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(name = "snippet_id", nullable = false)
    private Long snippetId;

    @Column(name = "match_percentage")
    private Double matchPercentage;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
