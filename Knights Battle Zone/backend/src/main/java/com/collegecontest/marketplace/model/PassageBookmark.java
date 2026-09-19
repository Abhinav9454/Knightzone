package com.collegecontest.marketplace.model;

import com.collegecontest.model.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "passage_bookmarks", uniqueConstraints = {
        @UniqueConstraint(name = "uk_passage_user_bookmark", columnNames = {"passage_id", "user_id"})
}, indexes = {
        @Index(name = "idx_passage_bookmark_passage", columnList = "passage_id"),
        @Index(name = "idx_passage_bookmark_user", columnList = "user_id")
})
public class PassageBookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "passage_id", nullable = false)
    private Passage passage;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

