package com.collegecontest.tracker.service;

import com.collegecontest.tracker.dto.TrackerSummaryResponse;
import com.collegecontest.tracker.dto.TrackerRecentProblemDTO;
import com.collegecontest.tracker.dto.TrackerGithubRepoDTO;
import com.collegecontest.tracker.model.GithubContributionSnapshot;
import com.collegecontest.tracker.model.UserPlatformConnection;
import com.collegecontest.tracker.model.UserSolvedProblem;
import com.collegecontest.tracker.repository.GithubContributionSnapshotRepository;
import com.collegecontest.tracker.repository.UserPlatformConnectionRepository;
import com.collegecontest.tracker.repository.UserSolvedProblemRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class TrackerSummaryService {
    private static final TypeReference<Map<String, Object>> MAP_REF = new TypeReference<>() {
    };

    private final UserSolvedProblemRepository solvedProblemRepository;
    private final GithubContributionSnapshotRepository githubContributionRepository;
    private final UserPlatformConnectionRepository connectionRepository;
    private final ObjectMapper objectMapper;

    public TrackerSummaryService(
            UserSolvedProblemRepository solvedProblemRepository,
            GithubContributionSnapshotRepository githubContributionRepository,
            UserPlatformConnectionRepository connectionRepository,
            ObjectMapper objectMapper) {
        this.solvedProblemRepository = solvedProblemRepository;
        this.githubContributionRepository = githubContributionRepository;
        this.connectionRepository = connectionRepository;
        this.objectMapper = objectMapper;
    }

    public TrackerSummaryResponse getSummary(Long userId) {
        List<UserSolvedProblem> solvedProblems = solvedProblemRepository.findByUserId(userId);
        List<GithubContributionSnapshot> githubContributions = githubContributionRepository.findByUserId(userId);
        List<UserPlatformConnection> connections = connectionRepository.findByUserId(userId);

        Map<String, Integer> platformSolvedCounts = new TreeMap<>();
        Map<String, Integer> difficultyCounts = new TreeMap<>();
        Map<String, Integer> topicCounts = new HashMap<>();
        Map<String, Integer> dailySolvedLast30Days = new LinkedHashMap<>();

        LocalDate today = LocalDate.now();
        for (int offset = 29; offset >= 0; offset--) {
            String key = today.minusDays(offset).toString();
            dailySolvedLast30Days.put(key, 0);
        }

        for (UserSolvedProblem problem : solvedProblems) {
            platformSolvedCounts.merge(problem.getPlatform().name(), 1, Integer::sum);
            String difficulty = normalizeDifficulty(problem.getDifficulty());
            difficultyCounts.merge(difficulty, 1, Integer::sum);
            splitTags(problem.getTopicTags()).forEach(tag -> topicCounts.merge(tag, 1, Integer::sum));
            if (problem.getSolvedAt() != null) {
                String key = problem.getSolvedAt().toLocalDate().toString();
                if (dailySolvedLast30Days.containsKey(key)) {
                    dailySolvedLast30Days.merge(key, 1, Integer::sum);
                }
            }
        }

        int weeklySolved = solvedProblems.stream()
                .filter(problem -> problem.getSolvedAt() != null)
                .map(UserSolvedProblem::getSolvedAt)
                .map(LocalDateTime::toLocalDate)
                .filter(date -> !date.isBefore(today.minusDays(6)))
                .mapToInt(date -> 1)
                .sum();

        int monthlySolved = solvedProblems.stream()
                .filter(problem -> problem.getSolvedAt() != null)
                .map(UserSolvedProblem::getSolvedAt)
                .map(LocalDateTime::toLocalDate)
                .filter(date -> !date.isBefore(today.minusDays(29)))
                .mapToInt(date -> 1)
                .sum();

        int currentStreakDays = 0;
        int bestStreakDays = 0;
        int runningStreak = 0;
        LocalDate cursor = today;
        Set<LocalDate> solvedDates = solvedProblems.stream()
                .map(UserSolvedProblem::getSolvedAt)
                .filter(Objects::nonNull)
                .map(LocalDateTime::toLocalDate)
                .collect(Collectors.toSet());

        while (solvedDates.contains(cursor)) {
            currentStreakDays++;
            cursor = cursor.minusDays(1);
        }
        List<LocalDate> sortedSolvedDates = solvedDates.stream().sorted().toList();
        LocalDate previous = null;
        for (LocalDate date : sortedSolvedDates) {
            if (previous == null || date.equals(previous.plusDays(1))) {
                runningStreak++;
            } else {
                runningStreak = 1;
            }
            bestStreakDays = Math.max(bestStreakDays, runningStreak);
            previous = date;
        }

        int githubRepos = githubContributions.size();
        int githubCommits = githubContributions.stream()
                .map(GithubContributionSnapshot::getCommits)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();

        Map<String, Integer> githubLanguages = new HashMap<>();
        for (GithubContributionSnapshot snapshot : githubContributions) {
            parseLanguages(snapshot.getLanguagesJson()).forEach((language, count) -> githubLanguages.merge(language, count, Integer::sum));
        }

        LocalDateTime lastSyncedAt = connections.stream()
                .map(UserPlatformConnection::getLastFetched)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        List<String> strongTopics = topicCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .toList();

        List<String> weakTopics = topicCounts.entrySet().stream()
                .sorted(Map.Entry.comparingByValue())
                .limit(5)
                .map(Map.Entry::getKey)
                .toList();

        List<TrackerRecentProblemDTO> recentProblems = solvedProblems.stream()
                .sorted(Comparator.comparing(UserSolvedProblem::getSolvedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(15)
                .map(problem -> TrackerRecentProblemDTO.builder()
                        .platform(problem.getPlatform().name())
                        .problemId(problem.getProblemId())
                        .problemName(problem.getProblemName())
                        .problemUrl(problem.getProblemUrl())
                        .difficulty(normalizeDifficulty(problem.getDifficulty()))
                        .topicTags(splitTags(problem.getTopicTags()))
                        .solvedAt(problem.getSolvedAt())
                        .build())
                .toList();

        List<TrackerGithubRepoDTO> githubTopRepos = githubContributions.stream()
                .sorted(Comparator
                        .comparing(GithubContributionSnapshot::getCommits, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(GithubContributionSnapshot::getStars, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .map(repo -> TrackerGithubRepoDTO.builder()
                        .repoName(repo.getRepoName())
                        .commits(repo.getCommits())
                        .stars(repo.getStars())
                        .forks(repo.getForks())
                        .lastUpdated(repo.getLastUpdated())
                        .build())
                .toList();

        return TrackerSummaryResponse.builder()
                .totalSolved(solvedProblems.size())
                .weeklySolved(weeklySolved)
                .monthlySolved(monthlySolved)
                .currentStreakDays(currentStreakDays)
                .bestStreakDays(bestStreakDays)
                .platformSolvedCounts(platformSolvedCounts)
                .difficultyCounts(difficultyCounts)
                .topicCounts(topicCounts.entrySet().stream()
                        .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                Map.Entry::getValue,
                                (a, b) -> a,
                                LinkedHashMap::new)))
                .dailySolvedLast30Days(dailySolvedLast30Days)
                .strongTopics(strongTopics)
                .weakTopics(weakTopics)
                .githubRepositories(githubRepos)
                .githubCommits(githubCommits)
                .githubLanguages(githubLanguages.entrySet().stream()
                        .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                Map.Entry::getValue,
                                (a, b) -> a,
                                LinkedHashMap::new)))
                .githubTopRepos(githubTopRepos)
                .recentProblems(recentProblems)
                .lastSyncedAt(lastSyncedAt)
                .build();
    }

    private String normalizeDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) {
            return "UNKNOWN";
        }
        String normalized = difficulty.trim().toUpperCase(Locale.ROOT);
        if (normalized.equals("EASY") || normalized.equals("MEDIUM") || normalized.equals("HARD")) {
            return normalized;
        }
        return "UNKNOWN";
    }

    private List<String> splitTags(String rawTags) {
        if (rawTags == null || rawTags.isBlank()) {
            return List.of();
        }
        return Arrays.stream(rawTags.split(","))
                .map(String::trim)
                .filter(tag -> !tag.isBlank())
                .map(tag -> tag.substring(0, 1).toUpperCase(Locale.ROOT) + tag.substring(1).toLowerCase(Locale.ROOT))
                .toList();
    }

    private Map<String, Integer> parseLanguages(String languagesJson) {
        if (languagesJson == null || languagesJson.isBlank()) {
            return Map.of();
        }
        try {
            Map<String, Object> map = objectMapper.readValue(languagesJson, MAP_REF);
            Map<String, Integer> output = new HashMap<>();
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                String key = entry.getKey();
                if (key == null || key.isBlank() || key.equalsIgnoreCase("primary")) {
                    continue;
                }
                if (entry.getValue() instanceof Number num) {
                    output.put(key, Math.max(1, num.intValue()));
                } else {
                    output.put(key, 1);
                }
            }
            Object primary = map.get("primary");
            if (output.isEmpty() && primary instanceof String primaryLang && !primaryLang.isBlank()) {
                output.put(primaryLang, 1);
            }
            return output;
        } catch (Exception ex) {
            return Map.of();
        }
    }
}
