package com.collegecontest.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_email", columnList = "email"),
        @Index(name = "idx_users_username", columnList = "username"),
        @Index(name = "idx_users_public_user_id", columnList = "public_user_id"),
        @Index(name = "idx_users_college", columnList = "college"),
        @Index(name = "idx_users_department", columnList = "department"),
        @Index(name = "idx_users_location", columnList = "location")
})
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, length = 100)
    private String username;

    @Column(name = "public_user_id", unique = true, updatable = false, length = 16)
    private String publicUserId;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String college;
    private String department;
    private LocalDateTime adminExpiresAt;
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String avatarUrl;

    @Column(length = 1500)
    private String bio;
    private String phone;
    private String location;
    private String timezone;
    private LocalDateTime dateOfBirth;

    @Column(length = 2000)
    private String skillsCsv;

    private String githubUrl;
    private String linkedinUrl;
    private String twitterUrl;
    private String portfolioUrl;

    @Column(nullable = false, length = 16)
    private String privacyEmail = "private";

    @Column(nullable = false, length = 16)
    private String privacyActivity = "public";

    @Column(nullable = false)
    private Boolean emailNotifications = true;

    @Column(nullable = false)
    private Boolean pushNotifications = false;

    @Column(nullable = false)
    private Boolean twoFactorEnabled = false;

    @Column(nullable = false)
    private Boolean emailVerified = false;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private Role role = Role.STUDENT;

    private LocalDateTime aiLastUsedAt;

    @Column(nullable = false)
    private Integer rating = 1000;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (rating == null) {
            rating = 1000;
        }
        if (emailNotifications == null) emailNotifications = true;
        if (pushNotifications == null) pushNotifications = false;
        if (twoFactorEnabled == null) twoFactorEnabled = false;
        if (emailVerified == null) emailVerified = false;
        if (privacyEmail == null || privacyEmail.isBlank()) privacyEmail = "private";
        if (privacyActivity == null || privacyActivity.isBlank()) privacyActivity = "public";
        if (publicUserId == null || publicUserId.isBlank()) {
            publicUserId = "CA" + UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, 8)
                    .toUpperCase(Locale.ROOT);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
