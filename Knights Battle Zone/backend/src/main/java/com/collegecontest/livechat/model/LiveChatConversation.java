package com.collegecontest.livechat.model;

import com.collegecontest.model.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "live_chat_conversations", indexes = {
        @Index(name = "idx_live_chat_conv_status", columnList = "status"),
        @Index(name = "idx_live_chat_conv_requester", columnList = "requester_user_id"),
        @Index(name = "idx_live_chat_conv_agent", columnList = "assigned_agent_id"),
        @Index(name = "idx_live_chat_conv_last_message", columnList = "last_message_at"),
        @Index(name = "idx_live_chat_conv_created", columnList = "created_at")
})
public class LiveChatConversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_user_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_agent_id")
    private User assignedAgent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LiveChatConversationStatus status = LiveChatConversationStatus.WAITING;

    @Column(nullable = false, length = 16)
    private String priority = "NORMAL";

    @Column(length = 64)
    private String category;

    @Column(length = 1200)
    private String summary;

    @Column(name = "source_page", length = 255)
    private String sourcePage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "last_message_at", nullable = false)
    private LocalDateTime lastMessageAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (lastMessageAt == null) {
            lastMessageAt = now;
        }
        if (status == null) {
            status = LiveChatConversationStatus.WAITING;
        }
        if (priority == null || priority.isBlank()) {
            priority = "NORMAL";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
