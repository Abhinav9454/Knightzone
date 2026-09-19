package com.collegecontest.typing.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class TypingProfileDTO {
    private Long userId;
    private String username;
    private Integer bestWpm;
    private Double bestAccuracy;
    private Integer bestRawWpm;
    private Integer bestErrors;
    private Integer bestDuration;
    private LocalDateTime bestAchievedAt;
    private Integer totalTests;
    private Integer totalPracticeSeconds;
    private Integer xp;
    private Integer level;
    private Integer streak;
    private LocalDate lastTestDate;
    private List<String> badges;
    private Integer rank;
    private Map<String, Integer> keyHeatmap;
}

