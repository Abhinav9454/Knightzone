package com.collegecontest.club.model;

import com.collegecontest.model.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "club_members", uniqueConstraints = {
        @UniqueConstraint(name = "uk_club_member", columnNames = {"club_id", "user_id"})
}, indexes = {
        @Index(name = "idx_club_members_user", columnList = "user_id"),
        @Index(name = "idx_club_members_club", columnList = "club_id")
})
public class ClubMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ClubMemberRole role = ClubMemberRole.MEMBER;

    private LocalDateTime mutedUntil;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    void onCreate() {
        if (joinedAt == null) {
            joinedAt = LocalDateTime.now();
        }
    }
}
