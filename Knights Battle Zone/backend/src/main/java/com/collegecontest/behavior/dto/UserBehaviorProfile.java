package com.collegecontest.behavior.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserBehaviorProfile {
    private Double averageAttemptsPerProblem;
    private Double averageTimeBetweenAttemptsMinutes;
    private List<ErrorCount> commonErrors;
    private Integer currentStreak;
    private Integer longestStreak;
    private Map<LocalDate, Integer> dailyActivity; // last 30 days
    private Boolean anomalyDetected;
}
