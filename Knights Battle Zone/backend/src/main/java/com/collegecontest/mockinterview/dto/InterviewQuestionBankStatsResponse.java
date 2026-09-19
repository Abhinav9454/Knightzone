package com.collegecontest.mockinterview.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InterviewQuestionBankStatsResponse {
    private long totalActiveQuestions;
    private long technicalQuestions;
    private long behavioralQuestions;
    private long hrQuestions;
    private long customQuestions;
    private long openEndedQuestions;
    private long mcqQuestions;
    private long codingQuestions;
    private long beginnerQuestions;
    private long intermediateQuestions;
    private long advancedQuestions;
}

