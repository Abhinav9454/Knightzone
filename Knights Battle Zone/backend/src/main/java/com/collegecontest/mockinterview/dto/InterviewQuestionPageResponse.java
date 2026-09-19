package com.collegecontest.mockinterview.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class InterviewQuestionPageResponse {
    private List<InterviewQuestionResponse> items;
    private long totalElements;
    private int totalPages;
    private int page;
    private int size;
    private boolean hasNext;
}

