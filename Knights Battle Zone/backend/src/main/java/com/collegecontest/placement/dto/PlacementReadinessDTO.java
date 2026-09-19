package com.collegecontest.placement.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PlacementReadinessDTO {
    private Double overallScore;
    private List<TopicGapDTO> gaps;
}
