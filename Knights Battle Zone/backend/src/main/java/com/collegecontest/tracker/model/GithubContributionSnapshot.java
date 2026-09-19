package com.collegecontest.tracker.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "github_contributions", indexes = {
        @Index(name = "idx_github_contrib_user", columnList = "user_id"),
        @Index(name = "idx_github_contrib_updated", columnList = "last_updated")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_github_repo_per_user", columnNames = { "user_id", "repo_name" })
})
@Data
public class GithubContributionSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "repo_name", nullable = false, length = 255)
    private String repoName;

    @Column(nullable = false)
    private Integer commits = 0;

    @Column(name = "languages_json", columnDefinition = "TEXT")
    private String languagesJson;

    @Column(nullable = false)
    private Integer stars = 0;

    @Column(nullable = false)
    private Integer forks = 0;

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onWrite() {
        lastUpdated = LocalDateTime.now();
    }
}

