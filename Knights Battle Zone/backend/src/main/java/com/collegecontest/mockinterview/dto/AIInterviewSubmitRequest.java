package com.collegecontest.mockinterview.dto;

import lombok.Data;

@Data
public class AIInterviewSubmitRequest {
    private Long interviewId;
    private Long questionId;
    private String answer;
    private String selectedOption;
    private Integer timeSpent;
}
