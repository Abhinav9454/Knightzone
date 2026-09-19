package com.collegecontest.livechat.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LiveChatFeedbackRequest(
        @NotNull @Min(-1) @Max(1) Integer rating,
        @Size(max = 1000) String comment
) {}
