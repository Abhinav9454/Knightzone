package com.collegecontest.service;

import com.collegecontest.behavior.dto.ErrorCount;
import com.collegecontest.behavior.dto.UserBehaviorProfile;
import com.collegecontest.behavior.model.SubmissionLog;
import com.collegecontest.behavior.repository.SubmissionLogRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BehaviorTrackerService {

    private final SubmissionLogRepository submissionLogRepository;

    public BehaviorTrackerService(SubmissionLogRepository submissionLogRepository) {
        this.submissionLogRepository = submissionLogRepository;
    }

    /**
     * Generate a user behavior profile for the past `days` days (default 90).
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "behaviorProfile", key = "#userId")
    public UserBehaviorProfile getUserBehaviorProfile(Long userId) {
        int days = 90;
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusDays(days);

        List<SubmissionLog> logs = submissionLogRepository.findByUserIdAndTimestampBetweenOrderByTimestampAsc(userId,
                start, end);
        if (logs == null || logs.isEmpty()) {
            // return empty profile
            Map<LocalDate, Integer> emptyDaily = new HashMap<>();
            LocalDate today = LocalDate.now();
            for (int i = 0; i < 30; i++)
                emptyDaily.put(today.minusDays(i), 0);
            return new UserBehaviorProfile(0.0, 0.0, Collections.emptyList(), 0, 0, emptyDaily, false);
        }

        // Group by problem to compute attempts until accepted
        Map<Long, List<SubmissionLog>> byProblem = logs.stream()
                .collect(Collectors.groupingBy(SubmissionLog::getProblemId, LinkedHashMap::new, Collectors.toList()));
        int problems = byProblem.size();
        double totalAttemptsUntilAccepted = 0.0;

        for (Map.Entry<Long, List<SubmissionLog>> e : byProblem.entrySet()) {
            List<SubmissionLog> plogs = e.getValue();
            int attempts = 0;
            boolean accepted = false;
            for (SubmissionLog sl : plogs) {
                attempts++;
                if (sl.getResult() != null && sl.getResult().equalsIgnoreCase("ACCEPTED")) {
                    accepted = true;
                    break;
                }
            }
            totalAttemptsUntilAccepted += attempts;
        }

        double averageAttemptsPerProblem = problems > 0 ? totalAttemptsUntilAccepted / problems : 0.0;

        // Average time between attempts (minutes)
        List<LocalDateTime> times = logs.stream().map(SubmissionLog::getTimestamp).sorted()
                .collect(Collectors.toList());
        List<Long> diffsMinutes = new ArrayList<>();
        for (int i = 1; i < times.size(); i++) {
            long diff = ChronoUnit.MINUTES.between(times.get(i - 1), times.get(i));
            diffsMinutes.add(diff);
        }
        double avgTimeBetween = diffsMinutes.isEmpty() ? 0.0
                : diffsMinutes.stream().mapToLong(Long::longValue).average().orElse(0.0);

        // Common error types (exclude ACCEPTED)
        Map<String, Long> errorCounts = logs.stream()
                .filter(l -> l.getResult() == null || !l.getResult().equalsIgnoreCase("ACCEPTED"))
                .collect(Collectors.groupingBy(l -> l.getResult() == null ? "UNKNOWN" : l.getResult(),
                        Collectors.counting()));

        long totalErrors = errorCounts.values().stream().mapToLong(Long::longValue).sum();
        List<ErrorCount> commonErrors = errorCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .limit(3)
                .map(en -> new ErrorCount(en.getKey(), en.getValue(),
                        totalErrors > 0 ? (en.getValue() * 100.0 / totalErrors) : 0.0))
                .collect(Collectors.toList());

        // Daily activity last 30 days
        LocalDate today = LocalDate.now();
        Map<LocalDate, Integer> daily = new LinkedHashMap<>();
        for (int i = 29; i >= 0; i--)
            daily.put(today.minusDays(i), 0);
        for (SubmissionLog sl : logs) {
            LocalDate d = sl.getTimestamp().toLocalDate();
            if (daily.containsKey(d))
                daily.put(d, daily.get(d) + 1);
        }

        // compute streaks (consecutive days with at least one submission)
        Set<LocalDate> activeDays = logs.stream().map(l -> l.getTimestamp().toLocalDate()).collect(Collectors.toSet());
        int currentStreak = 0;
        LocalDate cursor = today;
        while (activeDays.contains(cursor)) {
            currentStreak++;
            cursor = cursor.minusDays(1);
        }

        // longest streak within the period
        List<LocalDate> sortedActive = activeDays.stream().sorted().collect(Collectors.toList());
        int longest = 0;
        int running = 0;
        LocalDate prev = null;
        for (LocalDate d : sortedActive) {
            if (prev == null || d.equals(prev.plusDays(1))) {
                running++;
            } else {
                running = 1;
            }
            longest = Math.max(longest, running);
            prev = d;
        }

        // anomaly detection: compare recent gap to historical mean/stddev
        boolean anomaly = false;
        if (!diffsMinutes.isEmpty()) {
            double mean = diffsMinutes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            double variance = diffsMinutes.stream().mapToDouble(d -> (d - mean) * (d - mean)).sum()
                    / diffsMinutes.size();
            double std = Math.sqrt(variance);
            long lastGap = diffsMinutes.get(diffsMinutes.size() - 1);
            if (mean > 0 && lastGap < mean - 2 * std)
                anomaly = true;
        }

        return new UserBehaviorProfile(averageAttemptsPerProblem, avgTimeBetween, commonErrors, currentStreak, longest,
                daily, anomaly);
    }
}
