package com.collegecontest.mockinterview.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class InterviewRequest {
    private Long userId;
    private String userName;
    private Long interviewerId;
    private String interviewerName;
    private String sessionId;
    private LocalDateTime scheduledTime;
    private Integer durationMinutes;
    private String interviewType;
    private String mode;
    private String difficulty;
    private String topics;
    private String meetingLink;
    private List<Long> problemIds;
}
