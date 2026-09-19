package com.collegecontest.chat;

import java.time.Instant;

public class ChatResponseDTO {
    private String sessionId;
    private String reply;
    private Instant timestamp;

    public ChatResponseDTO() {
    }

    public ChatResponseDTO(String sessionId, String reply, Instant timestamp) {
        this.sessionId = sessionId;
        this.reply = reply;
        this.timestamp = timestamp;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
