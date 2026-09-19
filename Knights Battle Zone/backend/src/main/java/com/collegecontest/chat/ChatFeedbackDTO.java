package com.collegecontest.chat;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ChatFeedbackDTO {
    @NotBlank(message = "Session id is required")
    @Size(max = 120, message = "Session id is too long")
    private String sessionId;

    @NotNull(message = "Rating is required")
    @Min(value = -1, message = "Rating must be -1 or 1")
    @Max(value = 1, message = "Rating must be -1 or 1")
    private Integer rating;

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }
}
