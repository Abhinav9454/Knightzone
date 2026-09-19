package com.collegecontest.livechat.dto;

import jakarta.validation.constraints.Size;

public record CreateLiveChatConversationRequest(
        @Size(max = 64) String category,
        @Size(max = 1200) String summary,
        @Size(max = 255) String sourcePage,
        @Size(max = 16) String priority
) {}
