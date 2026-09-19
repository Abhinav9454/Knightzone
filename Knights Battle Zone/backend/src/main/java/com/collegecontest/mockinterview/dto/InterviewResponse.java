package com.collegecontest.mockinterview.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class InterviewResponse {
    private Long id;
    private String sessionId;
    private Long userId;
    private String userName;
    private Long interviewerId;
    private String interviewerName;
    private LocalDateTime scheduledTime;
    private Integer durationMinutes;
    private String interviewType;
    private String mode;
    private String difficulty;
    private String topics;
    private String meetingLink;
    private Boolean strictMode;
    private Boolean negativeMarking;
    private String masteryTrackId;
    private String masteryTrackTitle;
    private String status;
    private String feedback;
    private String recordingUrl;
    private Double overallScore;
    private Double technicalScore;
    private Double communicationScore;
    private Double problemSolvingScore;
    private Double confidenceScore;
    private String strengths;
    private String weaknesses;
    private String recommendations;
    private String certificateUrl;
    private String chatTranscript;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<Long> problemIds;
    private List<InterviewQuestionAttemptDTO> questions;
}
