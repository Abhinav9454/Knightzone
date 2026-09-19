package com.collegecontest.marketplace.model;

import com.collegecontest.model.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "passages", indexes = {
        @Index(name = "idx_passages_author", columnList = "author_id"),
        @Index(name = "idx_passages_approved_created", columnList = "approved, created_at"),
        @Index(name = "idx_passages_featured", columnList = "featured"),
        @Index(name = "idx_passages_status", columnList = "status"),
        @Index(name = "idx_passages_recent_play", columnList = "approved, last_played_at"),
        @Index(name = "idx_passages_trending_metrics", columnList = "approved, play_count, average_rating, completion_count, updated_at")
})
public class Passage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, length = 8000)
    private String content;

    @Column(length = 500)
    private String preview;

    @Column(name = "syntax_mode", nullable = false, length = 40)
    private String syntaxMode = "PLAIN";

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false)
    private boolean featured = false;

    @Column(nullable = false)
    private boolean approved = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PassageStatus status = PassageStatus.PENDING;

    @Column(name = "play_count", nullable = false)
    private long playCount = 0;

    @Column(name = "completion_count", nullable = false)
    private long completionCount = 0;

    @Column(name = "average_rating", nullable = false)
    private double averageRating = 0.0;

    @Column(name = "rating_count", nullable = false)
    private long ratingCount = 0;

    @Column(name = "last_played_at")
    private LocalDateTime lastPlayedAt;

    @Column(name = "last_rated_at")
    private LocalDateTime lastRatedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
