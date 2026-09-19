package com.collegecontest.club.model;

import com.collegecontest.model.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "club_challenge_attempts", indexes = {
        @Index(name = "idx_challenge_attempt_challenge", columnList = "club_challenge_id"),
        @Index(name = "idx_challenge_attempt_user", columnList = "user_id")
})
public class ClubChallengeAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_challenge_id", nullable = false)
    private ClubChallenge challenge;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private double wpm;

    @Column(nullable = false)
    private double accuracy;

    @Column(nullable = false)
    private double points;

    @Column(nullable = false)
    private LocalDateTime attemptedAt;

    @PrePersist
    void onCreate() {
        if (attemptedAt == null) {
            attemptedAt = LocalDateTime.now();
        }
    }
}
