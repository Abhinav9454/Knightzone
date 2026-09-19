package com.collegecontest.marketplace.model;

import com.collegecontest.model.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "passage_moderation_audit", indexes = {
        @Index(name = "idx_passage_moderation_audit_created", columnList = "created_at"),
        @Index(name = "idx_passage_moderation_audit_reviewer", columnList = "reviewer_id"),
        @Index(name = "idx_passage_moderation_audit_moderation", columnList = "moderation_id"),
        @Index(name = "idx_passage_moderation_audit_decision", columnList = "decision")
})
public class PassageModerationAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "moderation_id", nullable = false)
    private PassageModeration moderation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "passage_id", nullable = false)
    private Passage passage;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @Column(nullable = false, length = 16)
    private String decision;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", nullable = false, length = 16)
    private PassageModerationStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "next_status", nullable = false, length = 16)
    private PassageModerationStatus nextStatus;

    @Column(name = "review_notes", length = 1200)
    private String reviewNotes;

    @Column(name = "featured_after_decision", nullable = false)
    private boolean featuredAfterDecision;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
