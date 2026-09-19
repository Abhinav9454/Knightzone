package com.collegecontest.tracker.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class TrackerSummaryResponse {
    private int totalSolved;
    private int weeklySolved;
    private int monthlySolved;
    private int currentStreakDays;
    private int bestStreakDays;
    private Map<String, Integer> platformSolvedCounts;
    private Map<String, Integer> difficultyCounts;
    private Map<String, Integer> topicCounts;
    private Map<String, Integer> dailySolvedLast30Days;
    private List<String> strongTopics;
    private List<String> weakTopics;
    private int githubRepositories;
    private int githubCommits;
    private Map<String, Integer> githubLanguages;
    private List<TrackerGithubRepoDTO> githubTopRepos;
    private List<TrackerRecentProblemDTO> recentProblems;
    private LocalDateTime lastSyncedAt;
}
