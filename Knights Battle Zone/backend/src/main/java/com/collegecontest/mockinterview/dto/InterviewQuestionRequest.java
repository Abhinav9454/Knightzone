package com.collegecontest.mockinterview.dto;

import lombok.Data;

import java.util.List;

@Data
public class InterviewQuestionRequest {
    private String type;
    private String difficulty;
    private String category;
    private String questionFormat;
    private String question;
    private List<String> options;
    private String correctAnswer;
    private String explanation;
    private String expectedComplexity;
    private String companyTag;
    private Integer estimatedSeconds;
    private String expectedPoints;
    private String aiEvaluationCriteria;
    private String tags;
    private Boolean isActive;
}
