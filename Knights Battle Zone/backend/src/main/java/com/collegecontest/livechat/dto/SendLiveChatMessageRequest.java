package com.collegecontest.livechat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendLiveChatMessageRequest(
        @NotBlank @Size(max = 2000) String message,
        @Size(max = 32) String messageType
) {}
