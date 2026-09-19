package com.collegecontest.mockinterview.dto;

import lombok.Data;

@Data
public class InterviewFeedbackRequest {
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
}
