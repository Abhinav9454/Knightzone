package com.collegecontest.badge;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_badges", uniqueConstraints = { @UniqueConstraint(columnNames = { "user_id", "badge_id" }) })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBadge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "badge_id", nullable = false)
    private Long badgeId;

    @Column(name = "awarded_at")
    private LocalDateTime awardedAt;

    @PrePersist
    public void prePersist() {
        this.awardedAt = LocalDateTime.now();
    }
}
