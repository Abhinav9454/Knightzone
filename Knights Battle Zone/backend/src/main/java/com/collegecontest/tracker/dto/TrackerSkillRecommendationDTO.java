package com.collegecontest.tracker.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TrackerSkillRecommendationDTO {
    private String topic;
    private String reason;
    private List<String> suggestedProblems;
}

