package com.collegecontest.tracker.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_platforms", indexes = {
        @Index(name = "idx_user_platforms_user", columnList = "user_id"),
        @Index(name = "idx_user_platforms_platform", columnList = "platform"),
        @Index(name = "idx_user_platforms_last_fetched", columnList = "last_fetched")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_platform", columnNames = { "user_id", "platform" })
})
@Data
public class UserPlatformConnection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TrackerPlatform platform;

    @Column(nullable = false, length = 255)
    private String username;

    @Lob
    @Column(name = "access_token", columnDefinition = "LONGTEXT")
    private String accessToken;

    @Column(name = "last_fetched")
    private LocalDateTime lastFetched;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

