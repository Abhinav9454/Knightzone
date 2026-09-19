package com.collegecontest.livechat.dto;

import com.collegecontest.livechat.model.LiveChatConversationStatus;

import java.time.LocalDateTime;

public record LiveChatConversationDTO(
        Long id,
        LiveChatConversationStatus status,
        String priority,
        String category,
        String summary,
        String sourcePage,
        Long requesterUserId,
        String requesterName,
        Long assignedAgentId,
        String assignedAgentName,
        Long messageCount,
        LocalDateTime createdAt,
        LocalDateTime joinedAt,
        LocalDateTime closedAt,
        LocalDateTime lastMessageAt
) {}
