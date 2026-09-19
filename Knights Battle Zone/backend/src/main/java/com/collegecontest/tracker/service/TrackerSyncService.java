package com.collegecontest.tracker.service;

import com.collegecontest.tracker.dto.PlatformSyncResponse;
import com.collegecontest.tracker.model.GithubContributionSnapshot;
import com.collegecontest.tracker.model.TrackerPlatform;
import com.collegecontest.tracker.model.UserPlatformConnection;
import com.collegecontest.tracker.model.UserSolvedProblem;
import com.collegecontest.tracker.repository.GithubContributionSnapshotRepository;
import com.collegecontest.tracker.repository.UserPlatformConnectionRepository;
import com.collegecontest.tracker.repository.UserSolvedProblemRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.EnumSet;
import java.util.*;

@Service
@Transactional
public class TrackerSyncService {
    private static final Set<TrackerPlatform> SUPPORTED_PLATFORMS = EnumSet.of(
            TrackerPlatform.LEETCODE,
            TrackerPlatform.CODEFORCES,
            TrackerPlatform.GITHUB);

    private final UserPlatformConnectionRepository connectionRepository;
    private final UserSolvedProblemRepository solvedProblemRepository;
    private final GithubContributionSnapshotRepository githubContributionRepository;
    private final TrackerTokenCryptoService tokenCryptoService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${tracker.leetcode.url:https://leetcode.com/graphql}")
    private String leetCodeGraphqlUrl;

    public TrackerSyncService(
            UserPlatformConnectionRepository connectionRepository,
            UserSolvedProblemRepository solvedProblemRepository,
            GithubContributionSnapshotRepository githubContributionRepository,
            TrackerTokenCryptoService tokenCryptoService,
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        this.connectionRepository = connectionRepository;
        this.solvedProblemRepository = solvedProblemRepository;
        this.githubContributionRepository = githubContributionRepository;
        this.tokenCryptoService = tokenCryptoService;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public PlatformSyncResponse syncForUserAndPlatform(Long userId, TrackerPlatform platform) {
        if (!SUPPORTED_PLATFORMS.contains(platform)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Platform is currently unsupported");
        }

        UserPlatformConnection connection = connectionRepository.findByUserIdAndPlatform(userId, platform)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform is not connected"));

        SyncStats stats = switch (platform) {
            case LEETCODE -> syncLeetCode(connection);
            case CODEFORCES -> syncCodeforces(connection);
            case GITHUB -> syncGithub(connection);
            case GEEKSFORGEEKS, HACKERRANK -> SyncStats.failure(platform, "Platform is currently unsupported.");
        };

        connection.setLastFetched(LocalDateTime.now());
        connectionRepository.save(connection);

        return PlatformSyncResponse.builder()
                .platform(platform.name())
                .success(stats.success)
                .message(stats.message)
                .fetchedItems(stats.fetchedItems)
                .newItems(stats.newItems)
                .fetchedRepositories(stats.fetchedRepositories)
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public List<PlatformSyncResponse> syncAllForUser(Long userId) {
        List<UserPlatformConnection> connections = connectionRepository.findByUserId(userId);
        List<PlatformSyncResponse> responses = new ArrayList<>();
        for (UserPlatformConnection connection : connections) {
            if (SUPPORTED_PLATFORMS.contains(connection.getPlatform())) {
                responses.add(syncForUserAndPlatform(userId, connection.getPlatform()));
            }
        }
        return responses;
    }

    public List<PlatformSyncResponse> syncAllUsersAllPlatforms() {
        List<UserPlatformConnection> connections = connectionRepository.findAll();
        List<PlatformSyncResponse> responses = new ArrayList<>();
        for (UserPlatformConnection connection : connections) {
            if (SUPPORTED_PLATFORMS.contains(connection.getPlatform())) {
                responses.add(syncForUserAndPlatform(connection.getUserId(), connection.getPlatform()));
            }
        }
        return responses;
    }

    private SyncStats syncLeetCode(UserPlatformConnection connection) {
        try {
            String query = """
                    query recentAcSubmissions($username: String!, $limit: Int!) {
                      recentAcSubmissionList(username: $username, limit: $limit) {
                        title
                        titleSlug
                        timestamp
                      }
                    }
                    """;
            JsonNode root = postLeetCodeGraphql(query, Map.of("username", connection.getUsername(), "limit", 80));
            JsonNode submissions = root.path("data").path("recentAcSubmissionList");
            if (!submissions.isArray()) {
                return SyncStats.failure(TrackerPlatform.LEETCODE, "LeetCode response format unexpected.");
            }

            int fetchedItems = submissions.size();
            int newItems = 0;
            Map<String, LeetCodeMeta> metaCache = new HashMap<>();

            for (JsonNode item : submissions) {
                String slug = item.path("titleSlug").asText("");
                if (slug.isBlank()) continue;
                if (solvedProblemRepository.existsByUserIdAndPlatformAndProblemId(
                        connection.getUserId(),
                        TrackerPlatform.LEETCODE,
                        slug)) {
                    continue;
                }

                LeetCodeMeta meta = metaCache.computeIfAbsent(slug, this::fetchLeetCodeMetaSafe);
                UserSolvedProblem solved = new UserSolvedProblem();
                solved.setUserId(connection.getUserId());
                solved.setPlatform(TrackerPlatform.LEETCODE);
                solved.setProblemId(slug);
                solved.setProblemName(item.path("title").asText(slug));
                solved.setProblemUrl("https://leetcode.com/problems/" + slug);
                solved.setDifficulty(meta.difficulty);
                solved.setTopicTags(meta.tagsCsv);
                solved.setSolvedAt(safeFromEpochSeconds(item.path("timestamp").asLong(0L)));
                solvedProblemRepository.save(solved);
                newItems++;
            }
            return SyncStats.success(TrackerPlatform.LEETCODE, fetchedItems, newItems, 0);
        } catch (Exception ex) {
            return SyncStats.failure(TrackerPlatform.LEETCODE, "LeetCode sync failed: " + ex.getMessage());
        }
    }

    private LeetCodeMeta fetchLeetCodeMetaSafe(String titleSlug) {
        try {
            String query = """
                    query questionMeta($titleSlug: String!) {
                      question(titleSlug: $titleSlug) {
                        difficulty
                        topicTags {
                          name
                        }
                      }
                    }
                    """;
            JsonNode root = postLeetCodeGraphql(query, Map.of("titleSlug", titleSlug));
            JsonNode question = root.path("data").path("question");
            String difficulty = question.path("difficulty").asText("UNKNOWN");
            JsonNode tagsNode = question.path("topicTags");
            List<String> tags = new ArrayList<>();
            if (tagsNode.isArray()) {
                tagsNode.forEach(node -> {
                    String name = node.path("name").asText("");
                    if (!name.isBlank()) tags.add(name);
                });
            }
            return new LeetCodeMeta(normalizeDifficulty(difficulty), String.join(", ", tags));
        } catch (Exception ex) {
            return new LeetCodeMeta("UNKNOWN", "");
        }
    }

    private JsonNode postLeetCodeGraphql(String query, Map<String, Object> variables) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set("User-Agent", "UnifiedCode-Tracker/1.0");

        Map<String, Object> payload = new HashMap<>();
        payload.put("query", query);
        payload.put("variables", variables);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        ResponseEntity<JsonNode> response = restTemplate.exchange(
                leetCodeGraphqlUrl,
                HttpMethod.POST,
                request,
                JsonNode.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "LeetCode API is unavailable");
        }
        return response.getBody();
    }

    private SyncStats syncCodeforces(UserPlatformConnection connection) {
        try {
            String url = "https://codeforces.com/api/user.status?handle={handle}&from=1&count=1000";
            JsonNode root = restTemplate.getForObject(url, JsonNode.class, connection.getUsername());
            if (root == null || !"OK".equalsIgnoreCase(root.path("status").asText())) {
                return SyncStats.failure(TrackerPlatform.CODEFORCES, "Codeforces API returned non-OK status.");
            }

            JsonNode result = root.path("result");
            if (!result.isArray()) {
                return SyncStats.failure(TrackerPlatform.CODEFORCES, "Codeforces response format unexpected.");
            }

            int fetchedItems = 0;
            int newItems = 0;
            Set<String> processedProblemIds = new HashSet<>();

            for (JsonNode submission : result) {
                if (!"OK".equalsIgnoreCase(submission.path("verdict").asText())) {
                    continue;
                }

                JsonNode problem = submission.path("problem");
                String contestId = problem.path("contestId").asText("");
                String index = problem.path("index").asText("");
                if (contestId.isBlank() || index.isBlank()) {
                    continue;
                }

                String problemId = contestId + "-" + index;
                if (!processedProblemIds.add(problemId)) {
                    continue;
                }

                fetchedItems++;
                if (solvedProblemRepository.existsByUserIdAndPlatformAndProblemId(
                        connection.getUserId(),
                        TrackerPlatform.CODEFORCES,
                        problemId)) {
                    continue;
                }

                UserSolvedProblem solved = new UserSolvedProblem();
                solved.setUserId(connection.getUserId());
                solved.setPlatform(TrackerPlatform.CODEFORCES);
                solved.setProblemId(problemId);
                solved.setProblemName(problem.path("name").asText(problemId));
                solved.setProblemUrl("https://codeforces.com/problemset/problem/" + contestId + "/" + index);
                solved.setDifficulty(mapCodeforcesDifficulty(problem.path("rating").asInt(0)));
                solved.setTopicTags(readCodeforcesTags(problem.path("tags")));
                solved.setSolvedAt(safeFromEpochSeconds(submission.path("creationTimeSeconds").asLong(0L)));
                solvedProblemRepository.save(solved);
                newItems++;
            }

            return SyncStats.success(TrackerPlatform.CODEFORCES, fetchedItems, newItems, 0);
        } catch (Exception ex) {
            return SyncStats.failure(TrackerPlatform.CODEFORCES, "Codeforces sync failed: " + ex.getMessage());
        }
    }

    private String mapCodeforcesDifficulty(int rating) {
        if (rating <= 0) return "UNKNOWN";
        if (rating <= 1200) return "EASY";
        if (rating <= 1800) return "MEDIUM";
        return "HARD";
    }

    private String readCodeforcesTags(JsonNode tagsNode) {
        if (!tagsNode.isArray()) return "";
        List<String> tags = new ArrayList<>();
        tagsNode.forEach(tagNode -> {
            String value = tagNode.asText("");
            if (!value.isBlank()) tags.add(value);
        });
        return String.join(", ", tags);
    }

    private SyncStats syncGithub(UserPlatformConnection connection) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            headers.set("User-Agent", "UnifiedCode-Tracker/1.0");
            String token = tokenCryptoService.decrypt(connection.getAccessToken());
            if (token != null && !token.isBlank()) {
                headers.setBearerAuth(token);
            }
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<JsonNode> repoResponse = restTemplate.exchange(
                    "https://api.github.com/users/{username}/repos?per_page=100&sort=updated",
                    HttpMethod.GET,
                    request,
                    JsonNode.class,
                    connection.getUsername());
            JsonNode repos = repoResponse.getBody();
            if (repos == null || !repos.isArray()) {
                return SyncStats.failure(TrackerPlatform.GITHUB, "GitHub repository response is invalid.");
            }

            ResponseEntity<JsonNode> eventResponse = restTemplate.exchange(
                    "https://api.github.com/users/{username}/events/public?per_page=100",
                    HttpMethod.GET,
                    request,
                    JsonNode.class,
                    connection.getUsername());
            Map<String, Integer> repoCommitCounts = collectCommitCountsByRepo(eventResponse.getBody());

            int fetchedRepositories = 0;
            int newRepositories = 0;
            for (JsonNode repoNode : repos) {
                String repoName = repoNode.path("full_name").asText("");
                if (repoName.isBlank()) continue;
                fetchedRepositories++;

                GithubContributionSnapshot snapshot = githubContributionRepository
                        .findByUserIdAndRepoName(connection.getUserId(), repoName)
                        .orElseGet(GithubContributionSnapshot::new);

                boolean isNew = snapshot.getId() == null;
                snapshot.setUserId(connection.getUserId());
                snapshot.setRepoName(repoName);
                snapshot.setCommits(repoCommitCounts.getOrDefault(repoName, 0));
                snapshot.setStars(repoNode.path("stargazers_count").asInt(0));
                snapshot.setForks(repoNode.path("forks_count").asInt(0));
                snapshot.setLanguagesJson(buildLanguageJson(repoNode.path("language").asText("")));
                githubContributionRepository.save(snapshot);

                if (isNew) newRepositories++;
            }

            return SyncStats.success(TrackerPlatform.GITHUB, 0, newRepositories, fetchedRepositories);
        } catch (Exception ex) {
            return SyncStats.failure(TrackerPlatform.GITHUB, "GitHub sync failed: " + ex.getMessage());
        }
    }

    private Map<String, Integer> collectCommitCountsByRepo(JsonNode events) {
        if (events == null || !events.isArray()) {
            return Map.of();
        }
        Map<String, Integer> commits = new HashMap<>();
        for (JsonNode event : events) {
            if (!"PushEvent".equalsIgnoreCase(event.path("type").asText())) {
                continue;
            }
            String repoName = event.path("repo").path("name").asText("");
            if (repoName.isBlank()) {
                continue;
            }
            int commitCount = event.path("payload").path("commits").isArray()
                    ? event.path("payload").path("commits").size()
                    : 0;
            commits.merge(repoName, commitCount, Integer::sum);
        }
        return commits;
    }

    private String buildLanguageJson(String primaryLanguage) {
        Map<String, Object> payload = new LinkedHashMap<>();
        if (primaryLanguage != null && !primaryLanguage.isBlank()) {
            payload.put("primary", primaryLanguage);
            payload.put(primaryLanguage, 1);
        }
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            return "{}";
        }
    }

    private LocalDateTime safeFromEpochSeconds(long epochSeconds) {
        if (epochSeconds <= 0) {
            return LocalDateTime.now();
        }
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(epochSeconds), ZoneOffset.UTC);
    }

    private String normalizeDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) return "UNKNOWN";
        String normalized = difficulty.trim().toUpperCase(Locale.ROOT);
        if (normalized.equals("EASY") || normalized.equals("MEDIUM") || normalized.equals("HARD")) {
            return normalized;
        }
        return "UNKNOWN";
    }

    private record LeetCodeMeta(String difficulty, String tagsCsv) {
    }

    private static class SyncStats {
        private final TrackerPlatform platform;
        private final boolean success;
        private final String message;
        private final int fetchedItems;
        private final int newItems;
        private final int fetchedRepositories;

        private SyncStats(
                TrackerPlatform platform,
                boolean success,
                String message,
                int fetchedItems,
                int newItems,
                int fetchedRepositories) {
            this.platform = platform;
            this.success = success;
            this.message = message;
            this.fetchedItems = fetchedItems;
            this.newItems = newItems;
            this.fetchedRepositories = fetchedRepositories;
        }

        public static SyncStats success(TrackerPlatform platform, int fetchedItems, int newItems, int fetchedRepositories) {
            return new SyncStats(
                    platform,
                    true,
                    "Sync completed",
                    Math.max(0, fetchedItems),
                    Math.max(0, newItems),
                    Math.max(0, fetchedRepositories));
        }

        public static SyncStats failure(TrackerPlatform platform, String message) {
            return new SyncStats(platform, false, message, 0, 0, 0);
        }
    }
}
