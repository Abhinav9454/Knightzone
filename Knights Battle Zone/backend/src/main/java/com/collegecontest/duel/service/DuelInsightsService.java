package com.collegecontest.duel.service;

import com.collegecontest.duel.dto.*;
import com.collegecontest.duel.model.Duel;
import com.collegecontest.duel.model.DuelFairPlayFlag;
import com.collegecontest.duel.repository.DuelFairPlayFlagRepository;
import com.collegecontest.duel.repository.DuelRepository;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DuelInsightsService {

    private static final int DEFAULT_RATING = 1000;

    private final DuelRepository duelRepository;
    private final UserRepository userRepository;
    private final DuelFairPlayFlagRepository fairPlayFlagRepository;

    public DuelInsightsService(
            DuelRepository duelRepository,
            UserRepository userRepository,
            DuelFairPlayFlagRepository fairPlayFlagRepository
    ) {
        this.duelRepository = duelRepository;
        this.userRepository = userRepository;
        this.fairPlayFlagRepository = fairPlayFlagRepository;
    }

    @Transactional(readOnly = true)
    public List<DuelAdvancedLeaderboardEntryDTO> getAdvancedLeaderboard(int limit) {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(this::buildAdvancedEntry)
                .sorted(Comparator
                        .comparing(DuelAdvancedLeaderboardEntryDTO::getEffectiveRating, Comparator.reverseOrder())
                        .thenComparing(DuelAdvancedLeaderboardEntryDTO::getWinRate, Comparator.reverseOrder()))
                .limit(limit)
                .toList();
    }

    @Transactional(readOnly = true)
    public DuelMatchQualityDTO getMatchQuality(Long userId, String mode, String difficulty, Integer durationSeconds, Integer maxRatingGap) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        int rating = safeRating(user);
        String normalizedMode = mode == null || mode.isBlank() ? "CODING" : mode.trim().toUpperCase(Locale.ROOT);
        String normalizedDifficulty = difficulty == null || difficulty.isBlank() ? "ANY" : difficulty.trim().toUpperCase(Locale.ROOT);
        int safeDuration = durationSeconds == null || durationSeconds <= 0 ? 300 : Math.max(60, Math.min(durationSeconds, 1800));
        int safeGap = maxRatingGap == null || maxRatingGap <= 0 ? 300 : Math.max(100, Math.min(maxRatingGap, 800));

        List<Duel> openPool = duelRepository.findAll().stream()
                .filter(d -> "PENDING".equalsIgnoreCase(d.getStatus()))
                .filter(d -> d.getUser2Id() != null && d.getUser2Id() == 0L)
                .filter(d -> normalizedMode.equalsIgnoreCase(d.getMode()))
                .filter(d -> normalizedDifficulty.equalsIgnoreCase(d.getDifficulty()) || "ANY".equalsIgnoreCase(d.getDifficulty()))
                .filter(d -> !Objects.equals(d.getUser1Id(), userId))
                .toList();

        List<Integer> candidateGaps = openPool.stream()
                .map(Duel::getUser1Id)
                .map(userRepository::findById)
                .flatMap(Optional::stream)
                .map(this::safeRating)
                .map(candidateRating -> Math.abs(candidateRating - rating))
                .sorted()
                .toList();

        int recommendedGap = candidateGaps.isEmpty()
                ? Math.min(500, safeGap + 100)
                : Math.min(600, candidateGaps.get(Math.min(candidateGaps.size() - 1, 2)) + 80);

        int estimatedWaitSeconds;
        if (openPool.size() >= 5) {
            estimatedWaitSeconds = 12;
        } else if (openPool.size() >= 2) {
            estimatedWaitSeconds = 35;
        } else if (openPool.size() == 1) {
            estimatedWaitSeconds = 55;
        } else {
            estimatedWaitSeconds = 120;
        }

        long inactiveDays = computeInactiveDays(user.getId());
        String risk = inactiveDays > 28 ? "HIGH" : (inactiveDays > 14 ? "MEDIUM" : "LOW");

        return DuelMatchQualityDTO.builder()
                .mode(normalizedMode)
                .difficulty(normalizedDifficulty)
                .durationSeconds(safeDuration)
                .userRating(rating)
                .maxRatingGap(safeGap)
                .recommendedRatingGap(recommendedGap)
                .queuePoolSize(openPool.size())
                .estimatedWaitSeconds(estimatedWaitSeconds)
                .rankDecayRisk(risk)
                .build();
    }

    @Transactional
    public void analyzeSubmissionForFairPlay(Duel duel, Long userId, Double score, Boolean completed, String gameData) {
        if (duel == null || userId == null) return;

        double safeScore = score == null ? 0d : Math.max(0d, Math.min(100d, score));
        boolean isCompleted = Boolean.TRUE.equals(completed);
        long elapsedSeconds = 0L;
        if (duel.getStartedAt() != null) {
            elapsedSeconds = Math.max(1L, Duration.between(duel.getStartedAt(), LocalDateTime.now()).getSeconds());
        }

        if (isCompleted && safeScore >= 95d && elapsedSeconds > 0 && elapsedSeconds < 20) {
            saveFlag(duel.getId(), userId, "SPEED_ANOMALY", "HIGH",
                    "Very high score in unusually short completion time.",
                    "score=" + safeScore + ", elapsedSeconds=" + elapsedSeconds);
        }

        if (isCompleted && elapsedSeconds > 0) {
            double scorePerMinute = safeScore / (elapsedSeconds / 60d);
            if (scorePerMinute > 240d) {
                saveFlag(duel.getId(), userId, "SPEED_ANOMALY", "MEDIUM",
                        "Score velocity exceeded expected threshold.",
                        "scorePerMinute=" + String.format(Locale.ROOT, "%.2f", scorePerMinute));
            }
        }

        if (gameData != null && !gameData.isBlank()) {
            String compact = gameData.replaceAll("\\s+", "");
            int length = compact.length();
            long unique = compact.chars().distinct().count();
            double uniquenessRatio = length == 0 ? 1d : (double) unique / length;
            if (length > 80 && uniquenessRatio < 0.12d) {
                saveFlag(duel.getId(), userId, "BOT_PATTERN", "HIGH",
                        "Input pattern appears repetitive and bot-like.",
                        "length=" + length + ", uniquenessRatio=" + String.format(Locale.ROOT, "%.3f", uniquenessRatio));
            }
        } else if (isCompleted && safeScore >= 90d) {
            saveFlag(duel.getId(), userId, "REPLAY_ANALYSIS", "LOW",
                    "Replay data missing for high-scoring completion.",
                    "score=" + safeScore);
        }
    }

    @Transactional
    public DuelFairPlayFlagDTO reportFairPlayIssue(Long reporterUserId, DuelFairPlayReportRequest request) {
        if (request == null || request.getDuelId() == null || request.getReportedUserId() == null) {
            throw new IllegalArgumentException("duelId and reportedUserId are required");
        }
        if (Objects.equals(reporterUserId, request.getReportedUserId())) {
            throw new IllegalArgumentException("You cannot report yourself");
        }

        Duel duel = duelRepository.findById(request.getDuelId())
                .orElseThrow(() -> new IllegalArgumentException("Duel not found"));
        boolean isParticipant = Objects.equals(duel.getUser1Id(), reporterUserId)
                || Objects.equals(duel.getUser2Id(), reporterUserId);
        if (!isParticipant) {
            throw new IllegalArgumentException("Only duel participants can report this duel");
        }

        String reason = request.getReason() == null || request.getReason().isBlank()
                ? "Suspicious behavior detected by community report."
                : request.getReason().trim();
        DuelFairPlayFlag flag = new DuelFairPlayFlag();
        flag.setDuelId(request.getDuelId());
        flag.setReporterUserId(reporterUserId);
        flag.setReportedUserId(request.getReportedUserId());
        flag.setFlagType("COMMUNITY_REPORT");
        flag.setSeverity("MEDIUM");
        flag.setReason(reason);
        flag.setAnalysisDetails("reportedBy=" + reporterUserId);
        return toFlagDTO(fairPlayFlagRepository.save(flag));
    }

    @Transactional(readOnly = true)
    public DuelFairPlaySummaryDTO getFairPlaySummary(Long currentUserId) {
        List<DuelFairPlayFlagDTO> recent = fairPlayFlagRepository.findTop20ByReportedUserIdOrderByCreatedAtDesc(currentUserId)
                .stream()
                .map(this::toFlagDTO)
                .toList();
        return DuelFairPlaySummaryDTO.builder()
                .totalFlagsAgainstUser(fairPlayFlagRepository.countByReportedUserId(currentUserId))
                .openFlagsAgainstUser(fairPlayFlagRepository.countByReportedUserIdAndStatus(currentUserId, "OPEN"))
                .reportsSubmitted(fairPlayFlagRepository.countByReporterUserId(currentUserId))
                .recentFlagsAgainstUser(recent)
                .build();
    }

    @Transactional(readOnly = true)
    public List<DuelFairPlayFlagDTO> getFlagsForDuel(Long duelId) {
        return fairPlayFlagRepository.findByDuelIdOrderByCreatedAtDesc(duelId)
                .stream()
                .map(this::toFlagDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlatformAnalyticsDTO getPlatformAnalytics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneDay = now.minusDays(1);
        LocalDateTime sevenDays = now.minusDays(7);
        LocalDateTime thirtyDays = now.minusDays(30);

        List<Duel> allDuels = duelRepository.findAll();
        Set<Long> dauSet = new HashSet<>();
        Set<Long> wauSet = new HashSet<>();
        Set<Long> mauSet = new HashSet<>();

        long completedDuels = 0L;
        long activePending = 0L;
        long totalCompletionSeconds = 0L;
        long completionSamples = 0L;

        Map<String, Long> difficultyDistribution = new HashMap<>();

        for (Duel duel : allDuels) {
            LocalDateTime activityTime = Optional.ofNullable(duel.getCompletedAt()).orElse(duel.getCreatedAt());
            registerActivityUser(dauSet, activityTime, oneDay, duel.getUser1Id(), duel.getUser2Id());
            registerActivityUser(wauSet, activityTime, sevenDays, duel.getUser1Id(), duel.getUser2Id());
            registerActivityUser(mauSet, activityTime, thirtyDays, duel.getUser1Id(), duel.getUser2Id());

            String diff = duel.getDifficulty() == null || duel.getDifficulty().isBlank() ? "UNKNOWN" : duel.getDifficulty().toUpperCase(Locale.ROOT);
            difficultyDistribution.merge(diff, 1L, Long::sum);

            if ("COMPLETED".equalsIgnoreCase(duel.getStatus())) {
                completedDuels += 1;
                if (duel.getStartedAt() != null && duel.getCompletedAt() != null) {
                    long sec = Duration.between(duel.getStartedAt(), duel.getCompletedAt()).getSeconds();
                    if (sec > 0) {
                        totalCompletionSeconds += sec;
                        completionSamples += 1;
                    }
                }
            }
            if ("ACTIVE".equalsIgnoreCase(duel.getStatus()) || "PENDING".equalsIgnoreCase(duel.getStatus())) {
                activePending += 1;
            }
        }

        List<PlatformAnalyticsDTO.PopularPassage> popularPassages = List.of();

        List<PlatformAnalyticsDTO.DifficultyBucket> difficultyBuckets = difficultyDistribution.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(entry -> PlatformAnalyticsDTO.DifficultyBucket.builder()
                        .difficulty(entry.getKey())
                        .count(entry.getValue())
                        .build())
                .toList();

        double avgCompletionMinutes = completionSamples == 0
                ? 0d
                : (totalCompletionSeconds / (double) completionSamples) / 60d;

        return PlatformAnalyticsDTO.builder()
                .retention(PlatformAnalyticsDTO.Retention.builder()
                        .dau(dauSet.size())
                        .wau(wauSet.size())
                        .mau(mauSet.size())
                        .build())
                .engagement(PlatformAnalyticsDTO.Engagement.builder()
                        .totalDuels(allDuels.size())
                        .completedDuels(completedDuels)
                        .activePendingDuels(activePending)
                        .avgCompletionMinutes(Math.round(avgCompletionMinutes * 100.0) / 100.0)
                        .build())
                .popularPassages(popularPassages)
                .difficultyDistribution(difficultyBuckets)
                .build();
    }

    @Transactional(readOnly = true)
    public IntegrationStatsDTO getIntegrationStats(String platform, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        UserDuelStats stats = computeUserStats(user.getId());
        Integer bestWpm = 0;

        String baseProfileUrl = "/profile/" + user.getUsername();
        String widgetUrl = "/integrations/" + platform.toLowerCase(Locale.ROOT) + "/widget/" + user.getUsername();
        String summary = String.format(
                Locale.ROOT,
                "%s | Rating %d | W %d / L %d | Best WPM %d",
                user.getName(),
                safeRating(user),
                stats.wins,
                stats.losses,
                bestWpm == null ? 0 : bestWpm
        );

        return IntegrationStatsDTO.builder()
                .platform(platform.toUpperCase(Locale.ROOT))
                .username(user.getUsername())
                .publicUserId(user.getPublicUserId())
                .rating(safeRating(user))
                .wins(stats.wins)
                .losses(stats.losses)
                .bestWpm(bestWpm == null ? 0 : bestWpm)
                .profileUrl(baseProfileUrl)
                .widgetUrl(widgetUrl)
                .summary(summary)
                .build();
    }

    private DuelAdvancedLeaderboardEntryDTO buildAdvancedEntry(User user) {
        UserDuelStats stats = computeUserStats(user.getId());
        int rating = safeRating(user);
        long inactiveDays = computeInactiveDays(user.getId());
        int decayPenalty = inactiveDays <= 14 ? 0 : (int) Math.min(120, (inactiveDays - 14) * 3);
        int effectiveRating = Math.max(100, rating - decayPenalty);
        int winRate = stats.total == 0 ? 0 : (int) Math.round((stats.wins * 100.0) / stats.total);

        return DuelAdvancedLeaderboardEntryDTO.builder()
                .userId(user.getId())
                .username(user.getName())
                .rating(rating)
                .effectiveRating(effectiveRating)
                .wins(stats.wins)
                .losses(stats.losses)
                .totalDuels(stats.total)
                .winRate(winRate)
                .inactiveDays(inactiveDays)
                .rankDecayPenalty(decayPenalty)
                .skillTier(resolveSkillTier(effectiveRating))
                .build();
    }

    private long computeInactiveDays(Long userId) {
        List<Duel> duels = duelRepository.findByUser1IdOrUser2IdOrderByCreatedAtDesc(userId, userId);
        Optional<LocalDateTime> last = duels.stream()
                .map(duel -> Optional.ofNullable(duel.getCompletedAt()).orElse(duel.getCreatedAt()))
                .max(LocalDateTime::compareTo);
        if (last.isEmpty()) return 999;
        return Math.max(0, Duration.between(last.get(), LocalDateTime.now()).toDays());
    }

    private UserDuelStats computeUserStats(Long userId) {
        List<Duel> duels = duelRepository.findByUser1IdOrUser2IdOrderByCreatedAtDesc(userId, userId).stream()
                .filter(duel -> "COMPLETED".equalsIgnoreCase(duel.getStatus()) || "ABANDONED".equalsIgnoreCase(duel.getStatus()))
                .toList();
        long wins = duels.stream().filter(duel -> Objects.equals(duel.getWinnerId(), userId)).count();
        long losses = duels.stream().filter(duel -> duel.getWinnerId() != null && !Objects.equals(duel.getWinnerId(), userId)).count();
        return new UserDuelStats(duels.size(), wins, losses);
    }

    private String resolveSkillTier(int effectiveRating) {
        if (effectiveRating >= 2000) return "MASTER";
        if (effectiveRating >= 1750) return "DIAMOND";
        if (effectiveRating >= 1500) return "PLATINUM";
        if (effectiveRating >= 1300) return "GOLD";
        if (effectiveRating >= 1100) return "SILVER";
        return "BRONZE";
    }

    private int safeRating(User user) {
        return user.getRating() == null ? DEFAULT_RATING : user.getRating();
    }

    private void registerActivityUser(Set<Long> target, LocalDateTime activityTime, LocalDateTime threshold, Long user1Id, Long user2Id) {
        if (activityTime == null || activityTime.isBefore(threshold)) return;
        if (user1Id != null && user1Id > 0) target.add(user1Id);
        if (user2Id != null && user2Id > 0) target.add(user2Id);
    }

    private String cropSnippet(String raw) {
        String compact = raw.replaceAll("\\s+", " ").trim();
        if (compact.length() <= 72) return compact;
        return compact.substring(0, 72) + "...";
    }

    private DuelFairPlayFlag saveFlag(Long duelId, Long reportedUserId, String type, String severity, String reason, String details) {
        DuelFairPlayFlag flag = new DuelFairPlayFlag();
        flag.setDuelId(duelId);
        flag.setReporterUserId(0L);
        flag.setReportedUserId(reportedUserId);
        flag.setFlagType(type);
        flag.setSeverity(severity);
        flag.setReason(reason);
        flag.setAnalysisDetails(details);
        return fairPlayFlagRepository.save(flag);
    }

    private DuelFairPlayFlagDTO toFlagDTO(DuelFairPlayFlag flag) {
        return DuelFairPlayFlagDTO.builder()
                .id(flag.getId())
                .duelId(flag.getDuelId())
                .reporterUserId(flag.getReporterUserId())
                .reportedUserId(flag.getReportedUserId())
                .flagType(flag.getFlagType())
                .severity(flag.getSeverity())
                .reason(flag.getReason())
                .analysisDetails(flag.getAnalysisDetails())
                .status(flag.getStatus())
                .createdAt(flag.getCreatedAt())
                .build();
    }

    private record UserDuelStats(long total, long wins, long losses) {
    }
}
