package com.collegecontest.tracker.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TrackerSkillGapResponse {
    private String targetRole;
    private List<String> strongTopics;
    private List<String> weakTopics;
    private List<TrackerSkillRecommendationDTO> recommendedPractice;
    private boolean aiGenerated;
}

