package com.collegecontest.mockinterview.dto;

import lombok.Data;

@Data
public class MasteryTrackProgressRequest {
    private String trackId;
    private String trackTitle;
    private String interviewType;
    private String difficulty;
    private String questionFormat;
    private String topics;
    private String targetCompany;
    private String weeklyGoal;
    private Integer plannedSprintsPerWeek;
    private Integer currentWeek;
    private Double readinessScore;
    private Boolean strictMode;
    private Boolean negativeMarking;
}
