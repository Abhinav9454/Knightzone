package com.collegecontest.livechat.model;

import com.collegecontest.model.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "live_chat_feedback", uniqueConstraints = {
        @UniqueConstraint(name = "uk_live_chat_feedback_conversation_user", columnNames = {"conversation_id", "submitted_by_user_id"})
}, indexes = {
        @Index(name = "idx_live_chat_feedback_conversation", columnList = "conversation_id"),
        @Index(name = "idx_live_chat_feedback_submitted_by", columnList = "submitted_by_user_id")
})
public class LiveChatFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private LiveChatConversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submitted_by_user_id", nullable = false)
    private User submittedBy;

    @Column(nullable = false)
    private Integer rating;

    @Column(length = 1000)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
