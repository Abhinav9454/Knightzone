package com.collegecontest.livechat.dto;

import java.time.LocalDateTime;
import java.util.List;

public record LiveChatQueueEventDTO(
        String type,
        LocalDateTime at,
        List<LiveChatConversationDTO> queue
) {}
