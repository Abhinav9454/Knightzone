package com.collegecontest.resume;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ResumeStrengthService {

    private final ResumeMetricsRepository metricsRepository;
    private final UserProfileRepository userProfileRepository;

    public ResumeStrengthService(ResumeMetricsRepository metricsRepository,
            UserProfileRepository userProfileRepository) {
        this.metricsRepository = metricsRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public int computeResumeStrength(Long userId) {
        // weights
        double wSolved = 0.3, wDifficulty = 0.2, wContests = 0.15, wBadges = 0.15, wStreak = 0.2;

        Integer solved = metricsRepository.countDistinctSolved(userId);
        Integer maxDiff = metricsRepository.maxDifficultySolved(userId);
        LocalDateTime sixMonthsAgo = ZonedDateTime.now(ZoneId.systemDefault()).minusMonths(6).toLocalDateTime();
        Integer contests = metricsRepository.contestsInPeriod(userId, sixMonthsAgo);
        Integer badges = metricsRepository.countBadges(userId);
        Integer streak = metricsRepository.longestStreak(userId);

        int solvedCap = 500;
        int contestsCap = 20;
        int badgesCap = 20;
        int streakCap = 100;

        double solvedScore = normalizeTo100(solved == null ? 0 : solved, solvedCap);
        double diffScore = mapDifficultyTo100(maxDiff == null ? 0 : maxDiff);
        double contestsScore = normalizeTo100(contests == null ? 0 : contests, contestsCap);
        double badgesScore = normalizeTo100(badges == null ? 0 : badges, badgesCap);
        double streakScore = normalizeTo100(streak == null ? 0 : streak, streakCap);

        double weighted = (solvedScore * wSolved) + (diffScore * wDifficulty) + (contestsScore * wContests)
                + (badgesScore * wBadges) + (streakScore * wStreak);
        double denom = wSolved + wDifficulty + wContests + wBadges + wStreak;
        int finalScore = (int) Math.round(Math.min(100.0, weighted / denom));

        // persist
        UserProfile up = UserProfile.builder().userId(userId).resumeStrength(finalScore)
                .lastUpdated(LocalDateTime.now()).build();
        userProfileRepository.save(up);
        return finalScore;
    }

    public ResumeStrengthDTO getResumeStrength(Long userId) {
        Integer score = userProfileRepository.findById(userId).map(UserProfile::getResumeStrength).orElse(null);
        if (score == null) {
            score = computeResumeStrength(userId);
        }
        List<String> suggestions = generateSuggestions(userId);
        return ResumeStrengthDTO.builder().score(score).suggestions(suggestions).build();
    }

    private double normalizeTo100(int value, int cap) {
        if (cap <= 0)
            return 0.0;
        return Math.min(100.0, (value * 100.0) / cap);
    }

    private double mapDifficultyTo100(int difficulty) {
        // difficulty: 1=Easy,2=Medium,3=Hard; map to 0-100
        return switch (difficulty) {
            case 3 -> 100.0;
            case 2 -> 66.0;
            case 1 -> 33.0;
            default -> 0.0;
        };
    }

    private List<String> generateSuggestions(Long userId) {
        List<String> out = new ArrayList<>();
        Integer solved = metricsRepository.countDistinctSolved(userId);
        Integer maxDiff = metricsRepository.maxDifficultySolved(userId);
        LocalDateTime sixMonthsAgo = ZonedDateTime.now(ZoneId.systemDefault()).minusMonths(6).toLocalDateTime();
        Integer contests = metricsRepository.contestsInPeriod(userId, sixMonthsAgo);
        Integer badges = metricsRepository.countBadges(userId);
        Integer streak = metricsRepository.longestStreak(userId);

        if ((maxDiff == null || maxDiff < 2) && out.size() < 5)
            out.add("Try solving more Medium/Hard problems to increase max difficulty.");
        if ((solved == null || solved < 50) && out.size() < 5)
            out.add("Solve more problems across topics to increase total solved count.");
        if ((contests == null || contests < 3) && out.size() < 5)
            out.add("Participate in more contests to showcase competitive experience.");
        if ((badges == null || badges < 3) && out.size() < 5)
            out.add("Earn badges by contributing (editorials, testcases) to demonstrate impact.");
        if ((streak == null || streak < 7) && out.size() < 5)
            out.add("Maintain a regular practice streak to improve consistency.");
        if (out.isEmpty())
            out.add("Your profile looks strong; consider mentoring others or writing editorials to further boost visibility.");
        return out;
    }
}
