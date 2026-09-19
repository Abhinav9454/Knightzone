package com.collegecontest.typing.service;

import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import com.collegecontest.typing.dto.*;
import com.collegecontest.typing.model.TypingBestScore;
import com.collegecontest.typing.model.TypingTestResult;
import com.collegecontest.typing.model.TypingText;
import com.collegecontest.typing.repository.TypingBestScoreRepository;
import com.collegecontest.typing.repository.TypingTestResultRepository;
import com.collegecontest.typing.repository.TypingTextRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class TypingTestService {
    private final TypingTextRepository textRepository;
    private final TypingBestScoreRepository bestScoreRepository;
    private final TypingTestResultRepository testResultRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TypingTestService(
            TypingTextRepository textRepository,
            TypingBestScoreRepository bestScoreRepository,
            TypingTestResultRepository testResultRepository,
            UserRepository userRepository) {
        this.textRepository = textRepository;
        this.bestScoreRepository = bestScoreRepository;
        this.testResultRepository = testResultRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void ensureSeedTexts() {
        if (textRepository.count() > 0) return;
        seedText("General", "Easy", "Practice builds consistency and consistency builds confidence over time in every skill.");
        seedText("General", "Medium", "Readable code and clear communication help teams ship faster while keeping long-term maintenance under control.");
        seedText("General", "Hard", "Engineering excellence comes from deliberate iteration, strong review culture, measurable outcomes, and disciplined execution.");
        seedText("Tech", "Easy", "JavaScript, HTML, and CSS are foundational tools for creating responsive and interactive user interfaces.");
        seedText("Tech", "Medium", "A backend API should validate input, return consistent errors, and protect critical endpoints with authentication.");
        seedText("Tech", "Hard", "Distributed systems require careful handling of consistency, retries, idempotency, and observability to remain reliable.");
        seedText("Quotes", "Easy", "Success is the result of small efforts repeated day in and day out.");
        seedText("Kids", "Easy", "The cat ran to the red ball and played in the sunny park.");
        seedText("Hard", "Hard", "Cryptographic protocols and concurrent execution models demand rigorous testing and precise implementation details.");
        seedText("General", "Medium", "Typing practice with focused accuracy often produces higher long-term speed than rushed and inconsistent sessions.");
    }

    private void seedText(String category, String difficulty, String content) {
        TypingText text = new TypingText();
        text.setCategory(category);
        text.setDifficulty(difficulty);
        text.setContent(content);
        text.setSource("seed");
        textRepository.save(text);
    }

    public List<TypingTextDTO> getTexts(String category, String difficulty, int page, int size) {
        ensureSeedTexts();
        PageRequest pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(size, 1), 100));
        List<TypingText> texts;
        if (category != null && !category.isBlank() && difficulty != null && !difficulty.isBlank()) {
            texts = textRepository.findByActiveTrueAndCategoryIgnoreCaseAndDifficultyIgnoreCase(category, difficulty, pageable);
        } else if (category != null && !category.isBlank()) {
            texts = textRepository.findByActiveTrueAndCategoryIgnoreCase(category, pageable);
        } else if (difficulty != null && !difficulty.isBlank()) {
            texts = textRepository.findByActiveTrueAndDifficultyIgnoreCase(difficulty, pageable);
        } else {
            texts = textRepository.findByActiveTrue(pageable);
        }
        return texts.stream().map(this::toTextDTO).toList();
    }

    @Transactional
    public TypingTextDTO getRandomText(String category, String difficulty, boolean daily) {
        ensureSeedTexts();
        List<TypingTextDTO> pool = getTexts(category, difficulty, 0, 200);
        if (pool.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No typing text found");
        }
        int index;
        if (daily) {
            long seed = LocalDate.now().toEpochDay();
            index = (int) Math.floorMod(seed, pool.size());
        } else {
            index = new Random().nextInt(pool.size());
        }
        TypingTextDTO selected = pool.get(index);
        textRepository.findById(selected.getId()).ifPresent(text -> {
            text.setUsedCount((text.getUsedCount() == null ? 0 : text.getUsedCount()) + 1);
            textRepository.save(text);
        });
        return selected;
    }

    public List<String> getCategories() {
        ensureSeedTexts();
        return textRepository.findDistinctActiveCategories();
    }

    @Transactional
    public TypingScoreResponseDTO submitScore(String email, TypingScoreRequestDTO req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        TypingBestScore profile = bestScoreRepository.findByUserId(user.getId()).orElseGet(() -> {
            TypingBestScore value = new TypingBestScore();
            value.setUserId(user.getId());
            value.setBadgesJson("[]");
            value.setHeatmapJson("{}");
            return value;
        });

        int wpm = req.getWpm() == null ? 0 : Math.max(0, req.getWpm());
        int rawWpm = req.getRawWpm() == null ? wpm : Math.max(0, req.getRawWpm());
        double accuracy = req.getAccuracy() == null ? 0 : Math.max(0, Math.min(100, req.getAccuracy()));
        int duration = req.getTestDuration() == null ? 60 : Math.max(1, req.getTestDuration());
        int errors = req.getErrors() == null ? 0 : Math.max(0, req.getErrors());
        String mode = normalizeMode(req.getMode());
        int wordCountTarget = req.getWordCountTarget() == null ? 0 : Math.max(0, req.getWordCountTarget());
        String category = normalizeText(req.getCategory(), 80);
        String snippet = resolveTextSnippet(req.getTextSnippet(), req.getTextId());

        int previousLevel = profile.getLevelValue() == null ? 1 : profile.getLevelValue();
        int xpEarned = (int) Math.round(20 + (wpm * 0.7) + (accuracy * 0.5));
        profile.setXp((profile.getXp() == null ? 0 : profile.getXp()) + xpEarned);
        profile.setLevelValue(Math.max(1, 1 + (profile.getXp() / 300)));
        profile.setTotalTests((profile.getTotalTests() == null ? 0 : profile.getTotalTests()) + 1);
        profile.setTotalPracticeSeconds((profile.getTotalPracticeSeconds() == null ? 0 : profile.getTotalPracticeSeconds()) + duration);

        updateStreak(profile);
        mergeHeatmap(profile, req.getKeyMistakes());

        boolean newRecord = wpm > (profile.getBestWpm() == null ? 0 : profile.getBestWpm());
        if (newRecord) {
            profile.setBestWpm(wpm);
            profile.setBestRawWpm(rawWpm);
            profile.setBestAccuracy(accuracy);
            profile.setBestErrors(errors);
            profile.setBestDuration(duration);
            profile.setBestTextId(req.getTextId());
            profile.setBestAchievedAt(LocalDateTime.now());
        }

        List<String> currentBadges = parseBadges(profile.getBadgesJson());
        List<String> newlyEarned = earnBadges(currentBadges, profile);
        profile.setBadgesJson(writeJson(currentBadges, "[]"));
        bestScoreRepository.save(profile);

        TypingTestResult result = new TypingTestResult();
        result.setUserId(user.getId());
        result.setMode(mode);
        result.setWpm(wpm);
        result.setAccuracy(accuracy);
        result.setErrors(errors);
        result.setDurationSeconds(duration);
        result.setWordCountTarget(wordCountTarget > 0 ? wordCountTarget : null);
        result.setCategory(category);
        result.setTextSnippet(snippet);
        testResultRepository.save(result);

        TypingScoreResponseDTO response = new TypingScoreResponseDTO();
        response.setSuccess(true);
        response.setNewRecord(newRecord);
        response.setXpEarned(xpEarned);
        response.setLevelUp(profile.getLevelValue() > previousLevel);
        response.setBadgesEarned(newlyEarned);
        response.setProfile(buildProfileDTO(user, profile));
        return response;
    }

    public TypingProfileDTO getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        TypingBestScore profile = bestScoreRepository.findByUserId(user.getId()).orElseGet(() -> {
            TypingBestScore empty = new TypingBestScore();
            empty.setUserId(user.getId());
            empty.setBadgesJson("[]");
            empty.setHeatmapJson("{}");
            return empty;
        });
        return buildProfileDTO(user, profile);
    }

    public TypingProfileDTO getBestProfile(String email) {
        return getProfile(email);
    }

    public List<TypingLeaderboardEntryDTO> getLeaderboard(int limit) {
        return getLeaderboard("ALL", "ALL", limit);
    }

    public List<TypingLeaderboardEntryDTO> getLeaderboard(String mode, String timeRange, int limit) {
        int capped = Math.min(Math.max(limit, 1), 200);
        String safeMode = normalizeLeaderboardMode(mode);
        LocalDateTime from = resolveStartTime(timeRange);

        List<TypingTestResult> candidates = testResultRepository.findLeaderboardCandidates(
                safeMode,
                from,
                PageRequest.of(0, Math.max(500, capped * 10))
        );

        Map<Long, User> users = new HashMap<>();
        for (TypingTestResult row : candidates) {
            if (!users.containsKey(row.getUserId())) {
                userRepository.findById(row.getUserId()).ifPresent(user -> users.put(row.getUserId(), user));
            }
        }

        List<TypingLeaderboardEntryDTO> out = new ArrayList<>();
        Set<Long> seenUsers = new HashSet<>();
        int rank = 1;
        for (TypingTestResult row : candidates) {
            if (seenUsers.contains(row.getUserId())) continue;
            User user = users.get(row.getUserId());
            if (user == null) continue;

            out.add(new TypingLeaderboardEntryDTO(
                    rank++,
                    user.getId(),
                    user.getName(),
                    row.getWpm() == null ? 0 : row.getWpm(),
                    row.getAccuracy() == null ? 0.0 : row.getAccuracy(),
                    row.getCreatedAt()));
            seenUsers.add(row.getUserId());
            if (out.size() >= capped) break;
        }

        if (!out.isEmpty()) {
            return out;
        }

        return fallbackBestScoreLeaderboard(capped);
    }

    public List<TypingTestResultDTO> getUserResults(String email, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 200);
        return testResultRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(safePage, safeSize))
                .stream()
                .map(this::toResultDTO)
                .toList();
    }

    public Integer getUserRank(Long userId) {
        TypingBestScore profile = bestScoreRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Typing profile not found"));
        int higher = (int) bestScoreRepository.countByBestWpmGreaterThan(profile.getBestWpm() == null ? 0 : profile.getBestWpm());
        return higher + 1;
    }

    private TypingTextDTO toTextDTO(TypingText text) {
        TypingTextDTO dto = new TypingTextDTO();
        dto.setId(text.getId());
        dto.setContent(text.getContent());
        dto.setCategory(text.getCategory());
        dto.setDifficulty(text.getDifficulty());
        dto.setSource(text.getSource());
        return dto;
    }

    private TypingTestResultDTO toResultDTO(TypingTestResult row) {
        TypingTestResultDTO dto = new TypingTestResultDTO();
        dto.setId(row.getId());
        dto.setUserId(row.getUserId());
        dto.setMode(row.getMode());
        dto.setWpm(row.getWpm());
        dto.setAccuracy(row.getAccuracy());
        dto.setErrors(row.getErrors());
        dto.setDurationSeconds(row.getDurationSeconds());
        dto.setWordCountTarget(row.getWordCountTarget());
        dto.setCategory(row.getCategory());
        dto.setTextSnippet(row.getTextSnippet());
        dto.setCreatedAt(row.getCreatedAt());
        return dto;
    }

    private TypingProfileDTO buildProfileDTO(User user, TypingBestScore profile) {
        TypingProfileDTO dto = new TypingProfileDTO();
        dto.setUserId(user.getId());
        dto.setUsername(user.getName());
        dto.setBestWpm(profile.getBestWpm() == null ? 0 : profile.getBestWpm());
        dto.setBestAccuracy(profile.getBestAccuracy() == null ? 0.0 : profile.getBestAccuracy());
        dto.setBestRawWpm(profile.getBestRawWpm() == null ? 0 : profile.getBestRawWpm());
        dto.setBestErrors(profile.getBestErrors() == null ? 0 : profile.getBestErrors());
        dto.setBestDuration(profile.getBestDuration() == null ? 0 : profile.getBestDuration());
        dto.setBestAchievedAt(profile.getBestAchievedAt());
        dto.setTotalTests(profile.getTotalTests() == null ? 0 : profile.getTotalTests());
        dto.setTotalPracticeSeconds(profile.getTotalPracticeSeconds() == null ? 0 : profile.getTotalPracticeSeconds());
        dto.setXp(profile.getXp() == null ? 0 : profile.getXp());
        dto.setLevel(profile.getLevelValue() == null ? 1 : profile.getLevelValue());
        dto.setStreak(profile.getStreakDays() == null ? 0 : profile.getStreakDays());
        dto.setLastTestDate(profile.getLastTestDate());
        dto.setBadges(parseBadges(profile.getBadgesJson()));
        dto.setRank(getSafeRank(profile));
        dto.setKeyHeatmap(parseHeatmap(profile.getHeatmapJson()));
        return dto;
    }

    private Integer getSafeRank(TypingBestScore profile) {
        if (profile.getBestWpm() == null || profile.getBestWpm() <= 0) return null;
        return (int) bestScoreRepository.countByBestWpmGreaterThan(profile.getBestWpm()) + 1;
    }

    private void updateStreak(TypingBestScore profile) {
        LocalDate today = LocalDate.now();
        LocalDate last = profile.getLastTestDate();
        if (last == null) {
            profile.setStreakDays(1);
        } else if (last.isEqual(today)) {
            // no-op, already counted today
        } else if (last.plusDays(1).isEqual(today)) {
            profile.setStreakDays((profile.getStreakDays() == null ? 0 : profile.getStreakDays()) + 1);
        } else {
            profile.setStreakDays(1);
        }
        profile.setLastTestDate(today);
    }

    private void mergeHeatmap(TypingBestScore profile, Map<String, Integer> incoming) {
        Map<String, Integer> current = parseHeatmap(profile.getHeatmapJson());
        if (incoming != null) {
            incoming.forEach((key, value) -> {
                if (key == null || key.isBlank() || value == null || value <= 0) return;
                current.put(key, current.getOrDefault(key, 0) + value);
            });
        }
        profile.setHeatmapJson(writeJson(current, "{}"));
    }

    private List<String> parseBadges(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return new ArrayList<>(objectMapper.readValue(json, new TypeReference<List<String>>() {
            }));
        } catch (Exception ignored) {
            return new ArrayList<>();
        }
    }

    private Map<String, Integer> parseHeatmap(String json) {
        if (json == null || json.isBlank()) return new HashMap<>();
        try {
            return new HashMap<>(objectMapper.readValue(json, new TypeReference<Map<String, Integer>>() {
            }));
        } catch (Exception ignored) {
            return new HashMap<>();
        }
    }

    private List<String> earnBadges(List<String> currentBadges, TypingBestScore profile) {
        List<String> earned = new ArrayList<>();
        int bestWpm = profile.getBestWpm() == null ? 0 : profile.getBestWpm();
        double bestAcc = profile.getBestAccuracy() == null ? 0 : profile.getBestAccuracy();
        int streak = profile.getStreakDays() == null ? 0 : profile.getStreakDays();
        int tests = profile.getTotalTests() == null ? 0 : profile.getTotalTests();

        earned.addAll(grantBadge(currentBadges, tests >= 1, "First Test"));
        earned.addAll(grantBadge(currentBadges, bestWpm >= 50, "Speed Demon 50 WPM"));
        earned.addAll(grantBadge(currentBadges, bestAcc >= 98, "Accuracy King 98%"));
        earned.addAll(grantBadge(currentBadges, streak >= 7, "7-Day Streak"));
        earned.addAll(grantBadge(currentBadges, tests >= 30, "Practice Warrior"));
        return earned;
    }

    private List<String> grantBadge(List<String> currentBadges, boolean condition, String badge) {
        if (!condition || currentBadges.contains(badge)) return List.of();
        currentBadges.add(badge);
        return List.of(badge);
    }

    private String writeJson(Object value, String fallback) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private List<TypingLeaderboardEntryDTO> fallbackBestScoreLeaderboard(int limit) {
        List<TypingBestScore> rows = bestScoreRepository.findTop100ByOrderByBestWpmDescBestAccuracyDescBestAchievedAtAsc();
        Map<Long, User> users = new HashMap<>();
        for (TypingBestScore row : rows) {
            userRepository.findById(row.getUserId()).ifPresent(user -> users.put(row.getUserId(), user));
        }

        List<TypingLeaderboardEntryDTO> out = new ArrayList<>();
        int rank = 1;
        for (TypingBestScore row : rows) {
            User user = users.get(row.getUserId());
            if (user == null) continue;
            out.add(new TypingLeaderboardEntryDTO(
                    rank++,
                    user.getId(),
                    user.getName(),
                    row.getBestWpm() == null ? 0 : row.getBestWpm(),
                    row.getBestAccuracy() == null ? 0.0 : row.getBestAccuracy(),
                    row.getBestAchievedAt()));
            if (out.size() >= limit) break;
        }
        return out;
    }

    private LocalDateTime resolveStartTime(String value) {
        String normalized = value == null ? "ALL" : value.trim().toUpperCase(Locale.ROOT);
        if ("TODAY".equals(normalized)) {
            return LocalDate.now().atStartOfDay();
        }
        if ("WEEK".equals(normalized) || "THIS_WEEK".equals(normalized)) {
            return LocalDateTime.now().minusDays(7);
        }
        return LocalDateTime.of(1970, 1, 1, 0, 0);
    }

    private String normalizeLeaderboardMode(String mode) {
        String normalized = mode == null ? "ALL" : mode.trim().toUpperCase(Locale.ROOT);
        if (Set.of("ALL", "TIMED", "WORD_COUNT", "QUOTE", "CUSTOM").contains(normalized)) {
            return normalized;
        }
        return "ALL";
    }

    private String normalizeMode(String mode) {
        String normalized = mode == null ? "TIMED" : mode.trim().toUpperCase(Locale.ROOT);
        if (Set.of("TIMED", "WORD_COUNT", "QUOTE", "CUSTOM").contains(normalized)) {
            return normalized;
        }
        return "TIMED";
    }

    private String resolveTextSnippet(String explicitSnippet, Long textId) {
        String chosen = normalizeText(explicitSnippet, 400);
        if (chosen != null && !chosen.isBlank()) {
            return chosen;
        }

        if (textId == null) return null;
        return textRepository.findById(textId)
                .map(TypingText::getContent)
                .map(content -> normalizeText(content, 400))
                .orElse(null);
    }

    private String normalizeText(String value, int maxLength) {
        if (value == null) return null;
        String normalized = value.trim().replaceAll("\\s+", " ");
        if (normalized.isEmpty()) return null;
        if (normalized.length() <= maxLength) return normalized;
        return normalized.substring(0, maxLength);
    }
}
