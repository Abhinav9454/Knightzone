package com.collegecontest.placement.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TopicGapDTO {
    private String topicName;
    private Double requiredMastery;
    private Double userMastery;
    private Double deficit;
}
