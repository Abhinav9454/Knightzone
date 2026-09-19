package com.collegecontest.integrity.lateburst;

import com.collegecontest.repository.SubmissionRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Tracks recent submissions in Redis and detects sudden bursts in the last N minutes.
 */
@Service
public class LateBurstMonitor {

    private final StringRedisTemplate redisTemplate;
    private final LateBurstFlagRepository flagRepository;
    private final SubmissionRepository submissionRepository;

    public LateBurstMonitor(
            StringRedisTemplate redisTemplate,
            LateBurstFlagRepository flagRepository,
            SubmissionRepository submissionRepository) {
        this.redisTemplate = redisTemplate;
        this.flagRepository = flagRepository;
        this.submissionRepository = submissionRepository;
    }

    public void recordSubmission(Long userId, Long contestId, Long timestampMillis) {
        String key = String.format("burst:%d:%d", contestId, userId);
        double score = timestampMillis.doubleValue();
        String member = Long.toString(timestampMillis);
        redisTemplate.opsForZSet().add(key, member, score);
        redisTemplate.expire(key, java.time.Duration.ofMinutes(15));
    }

    @Transactional
    public void checkForLateBurst(Long contestId) {
        int windowMinutes = 10;
        double factorThreshold = 3.0;
        long now = Instant.now().toEpochMilli();
        long windowStart = Instant.now().minus(windowMinutes, ChronoUnit.MINUTES).toEpochMilli();

        // Fetch distinct user ids participating in the contest
        List<Long> userIds = submissionRepository.findDistinctUserIdsByContestId(contestId);
        if (userIds == null || userIds.isEmpty()) {
            return;
        }

        for (Long userId : userIds) {
            String key = String.format("burst:%d:%d", contestId, userId);
            Long recentCount = redisTemplate.opsForZSet().count(key, windowStart, now);
            if (recentCount == null) {
                recentCount = 0L;
            }

            // Count earlier submissions before windowStart
            LocalDateTime cutoffTime = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(windowStart), 
                ZoneId.systemDefault()
            );
            
            long earlierCount = submissionRepository.countByUserIdAndContestIdAndCreatedAtBefore(
                userId, contestId, cutoffTime);

            // Find first submission time for the contest
            LocalDateTime firstSubmissionTime = submissionRepository.findEarliestSubmissionTimeByContestId(contestId);
            if (firstSubmissionTime == null) {
                continue;
            }
            
            // Calculate average submissions per minute before the window
            long contestDurationMinutes = Math.max(1,
                ChronoUnit.MINUTES.between(firstSubmissionTime, LocalDateTime.now()) - windowMinutes);
            
            double earlierAvg = contestDurationMinutes > 0 ? 
                (double) earlierCount / (double) contestDurationMinutes : 0.0;

            // Calculate burst factor
            double factor;
            if (earlierAvg <= 0.0) {
                factor = recentCount > 0 ? Double.POSITIVE_INFINITY : 0.0;
            } else {
                factor = recentCount / earlierAvg;
            }

            // Check if burst exceeds threshold
            boolean spike = factor > factorThreshold;
            if (spike) {
                LateBurstFlag flag = LateBurstFlag.builder()
                        .contestId(contestId)
                        .userId(userId)
                        .recentCount(recentCount.intValue())
                        .earlierAverage(earlierAvg)
                        .factor(factor)
                        .createdAt(LocalDateTime.now())
                        .build();
                flagRepository.save(flag);
                
                System.out.printf("Late burst detected for user %d in contest %d: factor=%.2f%n", 
                    userId, contestId, factor);
            }
        }
    }
}
