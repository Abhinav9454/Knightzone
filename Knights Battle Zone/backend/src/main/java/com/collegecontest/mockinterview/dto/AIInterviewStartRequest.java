package com.collegecontest.mockinterview.dto;

import lombok.Data;

@Data
public class AIInterviewStartRequest {
    private String interviewType;
    private String difficulty;
    private String questionFormat; // MIXED, OPEN_ENDED, MCQ, CODING
    private String topics;
    private String targetCompany;
    private Integer durationMinutes;
    private Integer questionCount;
    private Integer mcqCount;
    private Integer codingCount;
    private Boolean strictMode;
    private Boolean negativeMarking;
    private String masteryTrackId;
    private String masteryTrackTitle;
}
