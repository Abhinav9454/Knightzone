package com.collegecontest.livechat.dto;

import com.collegecontest.livechat.model.LiveChatSenderType;

import java.time.LocalDateTime;

public record LiveChatMessageDTO(
        Long id,
        Long conversationId,
        LiveChatSenderType senderType,
        Long senderUserId,
        String senderName,
        String messageText,
        String messageType,
        LocalDateTime createdAt,
        LocalDateTime readAt
) {}
