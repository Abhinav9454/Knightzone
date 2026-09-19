package com.collegecontest.contrib;

import com.collegecontest.contrib.dto.ContributionHistoryDTO;
import com.collegecontest.contrib.dto.ContributionSummaryDTO;
import com.collegecontest.contrib.dto.ContributionTypeInfoDTO;
import com.collegecontest.contrib.dto.ContributionTypeStatDTO;
import com.collegecontest.contrib.dto.ContributorDTO;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ContributionService {

    private static final int DEFAULT_LEADERBOARD_LIMIT = 20;
    private static final int MAX_LEADERBOARD_LIMIT = 100;
    private static final int DEFAULT_HISTORY_LIMIT = 40;
    private static final int MAX_HISTORY_LIMIT = 200;
    private static final String DEFAULT_TYPE = "DISCUSSION";

    private static final Map<String, ContributionTypeConfig> TYPE_CONFIGS = createTypeConfigs();
    private static final Map<String, String> TYPE_ALIASES = Map.of(
            "PROBLEM_ADDED", "SOLUTION",
            "TEST_CASE_ADDED", "REVIEW",
            "EDITORIAL_WRITTEN", "TUTORIAL",
            "ARTICLE_WRITTEN", "ARTICLE",
            "COMMENT", "DISCUSSION"
    );

    private final ContributionRepository contributionRepository;

    public ContributionService(ContributionRepository contributionRepository) {
        this.contributionRepository = contributionRepository;
    }

    @Transactional
    public void addContribution(Long userId, String type, Long referenceId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("Valid userId is required.");
        }
        ContributionTypeConfig config = resolveConfig(type);
        if (Boolean.TRUE.equals(config.requiresReferenceId()) && (referenceId == null || referenceId <= 0)) {
            throw new IllegalArgumentException(config.label() + " requires a valid reference ID.");
        }
        Contribution c = Contribution.builder()
                .userId(userId)
                .type(config.key())
                .referenceId(referenceId)
                .points(config.points())
                .createdAt(LocalDateTime.now())
                .build();
        contributionRepository.save(c);
    }

    public Integer getContributionIndex(Long userId) {
        Integer points = contributionRepository.sumPointsByUserId(userId);
        return points == null ? 0 : points;
    }

    public List<ContributorDTO> getLeaderboard(int limit) {
        int safeLimit = clamp(limit, DEFAULT_LEADERBOARD_LIMIT, MAX_LEADERBOARD_LIMIT);
        List<Object[]> rows = contributionRepository.findTopContributorsDetailed(safeLimit);
        List<ContributorDTO> list = new ArrayList<>();
        for (Object[] r : rows) {
            Long uid = ((Number) r[0]).longValue();
            String username = r[1] == null ? ("User-" + uid) : r[1].toString();
            int totalPoints = r[2] == null ? 0 : ((Number) r[2]).intValue();
            int contributionsCount = r[3] == null ? 0 : ((Number) r[3]).intValue();
            LocalDateTime lastContributionAt = toLocalDateTime(r[4]);
            list.add(
                    ContributorDTO.builder()
                            .userId(uid)
                            .username(username)
                            .totalPoints(totalPoints)
                            .contributionsCount(contributionsCount)
                            .lastContributionAt(lastContributionAt)
                            .build()
            );
        }
        return list;
    }

    public List<ContributionTypeInfoDTO> getContributionTypes() {
        return TYPE_CONFIGS.values().stream()
                .map(config -> ContributionTypeInfoDTO.builder()
                        .key(config.key())
                        .label(config.label())
                        .description(config.description())
                        .points(config.points())
                        .hint(config.hint())
                        .requiresReferenceId(config.requiresReferenceId())
                        .build())
                .toList();
    }

    public List<ContributionHistoryDTO> getUserHistory(Long userId, int limit) {
        int safeLimit = clamp(limit, DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT);
        List<Contribution> rows = contributionRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, safeLimit));
        return rows.stream()
                .map(row -> {
                    ContributionTypeConfig config = resolveConfig(row.getType());
                    return ContributionHistoryDTO.builder()
                            .id(row.getId())
                            .type(config.key())
                            .label(config.label())
                            .referenceId(row.getReferenceId())
                            .points(row.getPoints())
                            .createdAt(row.getCreatedAt())
                            .build();
                })
                .toList();
    }

    public ContributionSummaryDTO getUserSummary(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last30Start = now.minusDays(30);

        int totalPoints = valueOrZero(contributionRepository.sumPointsByUserId(userId));
        int pointsLast30 = valueOrZero(contributionRepository.sumPointsByUserIdSince(userId, last30Start));
        int totalContributions = (int) contributionRepository.countByUserId(userId);
        int contributionsLast30 = (int) contributionRepository.countByUserIdAndCreatedAtAfter(userId, last30Start);

        List<Contribution> recentContributions = contributionRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(0, MAX_HISTORY_LIMIT));
        LocalDateTime lastContributionAt = recentContributions.isEmpty() ? null : recentContributions.get(0).getCreatedAt();

        Map<String, ContributionTypeStatDTO> breakdownMap = new LinkedHashMap<>();
        for (Object[] row : contributionRepository.findTypeBreakdownByUserId(userId)) {
            String type = row[0] == null ? DEFAULT_TYPE : row[0].toString();
            ContributionTypeConfig config = resolveConfig(type);
            int count = row[1] == null ? 0 : ((Number) row[1]).intValue();
            int points = row[2] == null ? 0 : ((Number) row[2]).intValue();
            breakdownMap.put(
                    config.key(),
                    ContributionTypeStatDTO.builder()
                            .type(config.key())
                            .label(config.label())
                            .count(count)
                            .points(points)
                            .build()
            );
        }

        List<ContributionTypeStatDTO> typeBreakdown = breakdownMap.values().stream()
                .sorted(Comparator.comparingInt(ContributionTypeStatDTO::getPoints).reversed())
                .toList();

        String bestType = typeBreakdown.isEmpty() ? "N/A" : typeBreakdown.get(0).getLabel();

        return ContributionSummaryDTO.builder()
                .userId(userId)
                .totalPoints(totalPoints)
                .totalContributions(totalContributions)
                .pointsLast30Days(pointsLast30)
                .contributionsLast30Days(contributionsLast30)
                .currentStreakDays(computeCurrentStreakDays(recentContributions))
                .badgeLevel(resolveBadgeLevel(totalPoints))
                .bestType(bestType)
                .lastContributionAt(lastContributionAt)
                .typeBreakdown(typeBreakdown)
                .build();
    }

    private static int computeCurrentStreakDays(List<Contribution> contributions) {
        if (contributions == null || contributions.isEmpty()) {
            return 0;
        }
        Set<LocalDate> activeDays = contributions.stream()
                .map(Contribution::getCreatedAt)
                .filter(Objects::nonNull)
                .map(LocalDateTime::toLocalDate)
                .collect(Collectors.toSet());

        LocalDate today = LocalDate.now();
        LocalDate startDay;
        if (activeDays.contains(today)) {
            startDay = today;
        } else if (activeDays.contains(today.minusDays(1))) {
            startDay = today.minusDays(1);
        } else {
            return 0;
        }

        int streak = 0;
        LocalDate cursor = startDay;
        while (activeDays.contains(cursor)) {
            streak += 1;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private static String resolveBadgeLevel(int totalPoints) {
        if (totalPoints >= 1200) return "Elite Contributor";
        if (totalPoints >= 700) return "Expert Contributor";
        if (totalPoints >= 300) return "Advanced Contributor";
        if (totalPoints >= 100) return "Rising Contributor";
        return "New Contributor";
    }

    private static ContributionTypeConfig resolveConfig(String rawType) {
        String key = normalizeType(rawType);
        return TYPE_CONFIGS.getOrDefault(key, TYPE_CONFIGS.get(DEFAULT_TYPE));
    }

    private static String normalizeType(String rawType) {
        if (rawType == null || rawType.isBlank()) {
            return DEFAULT_TYPE;
        }
        String normalized = rawType.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        String aliasResolved = TYPE_ALIASES.getOrDefault(normalized, normalized);
        if (TYPE_CONFIGS.containsKey(aliasResolved)) {
            return aliasResolved;
        }
        return DEFAULT_TYPE;
    }

    private static Map<String, ContributionTypeConfig> createTypeConfigs() {
        Map<String, ContributionTypeConfig> configs = new LinkedHashMap<>();
        register(configs, new ContributionTypeConfig(
                "ARTICLE",
                "Article",
                "Write a practical or conceptual article for the community.",
                40,
                "Use for blog-style educational content.",
                true
        ));
        register(configs, new ContributionTypeConfig(
                "TUTORIAL",
                "Tutorial",
                "Step-by-step learning or implementation guide.",
                35,
                "Best for guided learning modules.",
                true
        ));
        register(configs, new ContributionTypeConfig(
                "SOLUTION",
                "Solution",
                "High-quality problem solution with explanation.",
                25,
                "Include reasoning and complexity notes.",
                true
        ));
        register(configs, new ContributionTypeConfig(
                "BUG_REPORT",
                "Bug Report",
                "Actionable bug report with reproduction steps.",
                20,
                "Attach reproducible case for quick triage.",
                true
        ));
        register(configs, new ContributionTypeConfig(
                "DOC_IMPROVEMENT",
                "Docs Improvement",
                "Improve existing documentation clarity and structure.",
                18,
                "Use for edits to docs, README, onboarding guides.",
                true
        ));
        register(configs, new ContributionTypeConfig(
                "DISCUSSION",
                "Discussion",
                "Help others through quality discussions and Q&A.",
                15,
                "Use for forum threads and structured community help.",
                false
        ));
        register(configs, new ContributionTypeConfig(
                "REVIEW",
                "Review",
                "Peer review of content, problem statements, or solutions.",
                10,
                "Ideal for quality moderation tasks.",
                true
        ));
        return configs;
    }

    private static void register(Map<String, ContributionTypeConfig> configs, ContributionTypeConfig config) {
        configs.put(config.key(), config);
    }

    private static int clamp(int value, int fallback, int max) {
        if (value <= 0) {
            return fallback;
        }
        return Math.min(value, max);
    }

    private static int valueOrZero(Integer value) {
        return value == null ? 0 : value;
    }

    private static LocalDateTime toLocalDateTime(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime;
        }
        if (value instanceof java.sql.Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        try {
            return LocalDateTime.parse(value.toString().replace(' ', 'T'));
        } catch (Exception ignored) {
            return null;
        }
    }

    private record ContributionTypeConfig(
            String key,
            String label,
            String description,
            int points,
            String hint,
            Boolean requiresReferenceId
    ) {
    }
}
