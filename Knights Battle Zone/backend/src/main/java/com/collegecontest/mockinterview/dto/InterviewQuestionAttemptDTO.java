package com.collegecontest.mockinterview.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class InterviewQuestionAttemptDTO {
    private Long questionId;
    private String questionFormat;
    private String questionText;
    private List<String> options;
    private String selectedOption;
    private String expectedComplexity;
    private String userAnswer;
    private String aiFeedback;
    private Double score;
    private Integer timeSpent;
}
