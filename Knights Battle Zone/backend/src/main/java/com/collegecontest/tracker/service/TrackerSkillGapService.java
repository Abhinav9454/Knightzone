package com.collegecontest.tracker.service;

import com.collegecontest.ai.service.OpenAiGateway;
import com.collegecontest.tracker.dto.TrackerSkillGapResponse;
import com.collegecontest.tracker.dto.TrackerSkillRecommendationDTO;
import com.collegecontest.tracker.dto.TrackerSummaryResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class TrackerSkillGapService {
    private final TrackerSummaryService trackerSummaryService;
    private final OpenAiGateway openAiGateway;
    private final ObjectMapper objectMapper;

    private static final Map<String, List<String>> TOPIC_TO_PROBLEMS = Map.of(
            "Dynamic programming", List.of(
                    "LeetCode 300 - https://leetcode.com/problems/longest-increasing-subsequence/",
                    "LeetCode 322 - https://leetcode.com/problems/coin-change/",
                    "LeetCode 1143 - https://leetcode.com/problems/longest-common-subsequence/"),
            "Graph", List.of(
                    "LeetCode 200 - https://leetcode.com/problems/number-of-islands/",
                    "LeetCode 207 - https://leetcode.com/problems/course-schedule/",
                    "Codeforces 20C - https://codeforces.com/problemset/problem/20/C"),
            "Tree", List.of(
                    "LeetCode 102 - https://leetcode.com/problems/binary-tree-level-order-traversal/",
                    "LeetCode 236 - https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
                    "Codeforces 580C - https://codeforces.com/problemset/problem/580/C"),
            "Array", List.of(
                    "LeetCode 238 - https://leetcode.com/problems/product-of-array-except-self/",
                    "LeetCode 560 - https://leetcode.com/problems/subarray-sum-equals-k/",
                    "Codeforces 363B - https://codeforces.com/problemset/problem/363/B"),
            "String", List.of(
                    "LeetCode 3 - https://leetcode.com/problems/longest-substring-without-repeating-characters/",
                    "LeetCode 76 - https://leetcode.com/problems/minimum-window-substring/",
                    "Codeforces 266A - https://codeforces.com/problemset/problem/266/A")
    );

    public TrackerSkillGapService(
            TrackerSummaryService trackerSummaryService,
            OpenAiGateway openAiGateway,
            ObjectMapper objectMapper) {
        this.trackerSummaryService = trackerSummaryService;
        this.openAiGateway = openAiGateway;
        this.objectMapper = objectMapper;
    }

    public TrackerSkillGapResponse getSkillGap(Long userId, String targetRole, boolean useAi) {
        TrackerSummaryResponse summary = trackerSummaryService.getSummary(userId);
        String normalizedRole = (targetRole == null || targetRole.isBlank()) ? "SDE" : targetRole.trim();
        if (useAi) {
            TrackerSkillGapResponse ai = tryAiSkillGap(summary, normalizedRole);
            if (ai != null) {
                return ai;
            }
        }
        return buildFallbackSkillGap(summary, normalizedRole, false);
    }

    private TrackerSkillGapResponse tryAiSkillGap(TrackerSummaryResponse summary, String targetRole) {
        try {
            String prompt = """
                    You are an expert competitive programming coach.
                    Analyze the student's solved problems data and identify weak areas.
                    Target role: %s
                    Topic counts: %s
                    Return STRICT JSON only:
                    {
                      "strongTopics": ["Array"],
                      "weakTopics": ["Graph"],
                      "recommendedPractice": [
                        {"topic":"Graph","reason":"Need more graph practice","suggestedProblems":["LeetCode 200","LeetCode 207"]}
                      ]
                    }
                    """.formatted(targetRole, summary.getTopicCounts());

            String raw = openAiGateway.generate(prompt);
            JsonNode root = objectMapper.readTree(raw);
            List<String> strong = toStringList(root.path("strongTopics"));
            List<String> weak = toStringList(root.path("weakTopics"));
            List<TrackerSkillRecommendationDTO> recommendations = new ArrayList<>();
            JsonNode recNode = root.path("recommendedPractice");
            if (recNode.isArray()) {
                for (JsonNode item : recNode) {
                    recommendations.add(TrackerSkillRecommendationDTO.builder()
                            .topic(item.path("topic").asText("General"))
                            .reason(item.path("reason").asText("Practice this topic more"))
                            .suggestedProblems(toStringList(item.path("suggestedProblems")))
                            .build());
                }
            }
            return TrackerSkillGapResponse.builder()
                    .targetRole(targetRole)
                    .strongTopics(strong.isEmpty() ? summary.getStrongTopics() : strong)
                    .weakTopics(weak.isEmpty() ? summary.getWeakTopics() : weak)
                    .recommendedPractice(recommendations.isEmpty()
                            ? fallbackRecommendations(summary.getWeakTopics())
                            : recommendations)
                    .aiGenerated(true)
                    .build();
        } catch (Exception ex) {
            return null;
        }
    }

    private TrackerSkillGapResponse buildFallbackSkillGap(
            TrackerSummaryResponse summary,
            String targetRole,
            boolean aiGenerated) {
        List<String> strong = summary.getStrongTopics();
        List<String> weak = summary.getWeakTopics();
        return TrackerSkillGapResponse.builder()
                .targetRole(targetRole)
                .strongTopics(strong)
                .weakTopics(weak)
                .recommendedPractice(fallbackRecommendations(weak))
                .aiGenerated(aiGenerated)
                .build();
    }

    private List<TrackerSkillRecommendationDTO> fallbackRecommendations(List<String> weakTopics) {
        List<String> topics = weakTopics.isEmpty() ? List.of("Dynamic programming", "Graph") : weakTopics;
        List<TrackerSkillRecommendationDTO> output = new ArrayList<>();
        for (String topic : topics.stream().limit(5).toList()) {
            List<String> suggestions = TOPIC_TO_PROBLEMS.getOrDefault(topic, List.of(
                    "LeetCode 1 - https://leetcode.com/problems/two-sum/",
                    "LeetCode 121 - https://leetcode.com/problems/best-time-to-buy-and-sell-stock/"));
            output.add(TrackerSkillRecommendationDTO.builder()
                    .topic(topic)
                    .reason("Low solve count in this topic compared to your overall activity.")
                    .suggestedProblems(suggestions)
                    .build());
        }
        return output;
    }

    private List<String> toStringList(JsonNode node) {
        if (!node.isArray()) return List.of();
        List<String> output = new ArrayList<>();
        node.forEach(item -> {
            String value = item.asText("");
            if (!value.isBlank()) output.add(value);
        });
        return output;
    }
}

