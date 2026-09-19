package com.collegecontest.livechat.model;

import com.collegecontest.model.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "live_chat_messages", indexes = {
        @Index(name = "idx_live_chat_msg_conversation", columnList = "conversation_id"),
        @Index(name = "idx_live_chat_msg_created", columnList = "created_at"),
        @Index(name = "idx_live_chat_msg_sender_user", columnList = "sender_user_id")
})
public class LiveChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private LiveChatConversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 16)
    private LiveChatSenderType senderType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_user_id")
    private User senderUser;

    @Column(name = "message_text", nullable = false, length = 2000)
    private String messageText;

    @Column(name = "message_type", nullable = false, length = 32)
    private String messageType = "TEXT";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (messageType == null || messageType.isBlank()) {
            messageType = "TEXT";
        }
    }
}
