package com.collegecontest.tracker.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TrackerRecentProblemDTO {
    private String platform;
    private String problemId;
    private String problemName;
    private String problemUrl;
    private String difficulty;
    private List<String> topicTags;
    private LocalDateTime solvedAt;
}

