package com.collegecontest.tracker.service;

import com.collegecontest.ai.service.OpenAiGateway;
import com.collegecontest.tracker.dto.TrackerInsightResponse;
import com.collegecontest.tracker.dto.TrackerSummaryResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class TrackerInsightService {
    private final TrackerSummaryService trackerSummaryService;
    private final OpenAiGateway openAiGateway;

    public TrackerInsightService(TrackerSummaryService trackerSummaryService, OpenAiGateway openAiGateway) {
        this.trackerSummaryService = trackerSummaryService;
        this.openAiGateway = openAiGateway;
    }

    public TrackerInsightResponse weeklyInsight(Long userId, boolean useAi) {
        TrackerSummaryResponse summary = trackerSummaryService.getSummary(userId);
        String fallback = buildFallbackSummary(summary);
        List<String> recommendations = buildRecommendations(summary);

        if (!useAi) {
            return TrackerInsightResponse.builder()
                    .summary(fallback)
                    .recommendations(recommendations)
                    .aiGenerated(false)
                    .generatedAt(LocalDateTime.now())
                    .build();
        }

        try {
            String prompt = buildWeeklyPrompt(summary);
            String aiSummary = openAiGateway.generate(prompt);
            return TrackerInsightResponse.builder()
                    .summary(aiSummary)
                    .recommendations(recommendations)
                    .aiGenerated(true)
                    .generatedAt(LocalDateTime.now())
                    .build();
        } catch (Exception ex) {
            return TrackerInsightResponse.builder()
                    .summary(fallback)
                    .recommendations(recommendations)
                    .aiGenerated(false)
                    .generatedAt(LocalDateTime.now())
                    .build();
        }
    }

    private String buildFallbackSummary(TrackerSummaryResponse summary) {
        String strong = summary.getStrongTopics().isEmpty()
                ? "No strong topic identified yet."
                : "Strong topics: " + String.join(", ", summary.getStrongTopics()) + ".";
        String weak = summary.getWeakTopics().isEmpty()
                ? "No weak topic identified yet."
                : "Focus more on: " + String.join(", ", summary.getWeakTopics()) + ".";
        return "You solved " + summary.getTotalSolved() + " problems across platforms. "
                + strong + " " + weak
                + " GitHub activity: " + summary.getGithubRepositories() + " repositories and "
                + summary.getGithubCommits() + " recent commits tracked.";
    }

    private List<String> buildRecommendations(TrackerSummaryResponse summary) {
        List<String> list = new ArrayList<>();
        if (!summary.getWeakTopics().isEmpty()) {
            list.add("Solve at least 5 problems this week from: " + String.join(", ", summary.getWeakTopics()));
        }
        if (summary.getDifficultyCounts().getOrDefault("HARD", 0) == 0) {
            list.add("Add 1 hard problem every 2-3 days for interview readiness.");
        }
        if (summary.getGithubRepositories() == 0) {
            list.add("Create at least one GitHub project and push daily commits.");
        } else if (summary.getGithubCommits() < 5) {
            list.add("Increase GitHub commit consistency (target 1+ commit/day).");
        }
        if (list.isEmpty()) {
            list.add("Keep current momentum and continue mixed difficulty practice.");
        }
        return list;
    }

    private String buildWeeklyPrompt(TrackerSummaryResponse summary) {
        Map<String, Integer> topics = summary.getTopicCounts();
        String topicSnippet = topics.entrySet().stream()
                .limit(10)
                .map(e -> e.getKey() + ":" + e.getValue())
                .collect(Collectors.joining(", "));
        return """
                You are a coding mentor. Generate a concise weekly progress summary (max 150 words).
                Student Data:
                - Total solved: %d
                - Platform breakdown: %s
                - Difficulty breakdown: %s
                - Topics covered: %s
                - GitHub: repos=%d, commits=%d, languages=%s
                Highlight achievements, point out weak areas, and suggest next focus.
                """.formatted(
                summary.getTotalSolved(),
                summary.getPlatformSolvedCounts(),
                summary.getDifficultyCounts(),
                topicSnippet,
                summary.getGithubRepositories(),
                summary.getGithubCommits(),
                summary.getGithubLanguages());
    }
}

