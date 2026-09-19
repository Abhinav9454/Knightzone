package com.collegecontest.duel.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IntegrationStatsDTO {
    private String platform;
    private String username;
    private String publicUserId;
    private Integer rating;
    private Long wins;
    private Long losses;
    private Integer bestWpm;
    private String profileUrl;
    private String widgetUrl;
    private String summary;
}
