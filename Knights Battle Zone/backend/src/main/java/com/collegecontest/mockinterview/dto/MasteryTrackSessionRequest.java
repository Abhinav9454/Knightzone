package com.collegecontest.mockinterview.dto;

import lombok.Data;

@Data
public class MasteryTrackSessionRequest {
    private String trackId;
    private Long interviewId;
    private Double sessionScore;
}
