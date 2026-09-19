package com.collegecontest.rapid.service;

import com.collegecontest.rapid.model.RapidSubmissionViolation;
import com.collegecontest.rapid.repository.RapidSubmissionViolationRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
public class RapidSubmissionAlert {

    private final StringRedisTemplate redisTemplate;
    private final RapidSubmissionViolationRepository violationRepository;

    // min interval in seconds, configurable if needed
    private final long defaultMinInterval = 5;

    public RapidSubmissionAlert(StringRedisTemplate redisTemplate,
            RapidSubmissionViolationRepository violationRepository) {
        this.redisTemplate = redisTemplate;
        this.violationRepository = violationRepository;
    }

    @Transactional
    public boolean isSubmissionAllowed(Long userId, Long contestId, long currentTimestampMillis,
            long minIntervalSeconds) {
        String key = String.format("last_submit:%d:%d", contestId, userId);
        String last = redisTemplate.opsForValue().get(key);
        long now = currentTimestampMillis;
        if (last == null) {
            redisTemplate.opsForValue().set(key, String.valueOf(now));
            // set ttl for contest length could be applied; skip
            return true;
        }

        long lastTs = Long.parseLong(last);
        long diff = (now - lastTs) / 1000L;
        long threshold = minIntervalSeconds > 0 ? minIntervalSeconds : defaultMinInterval;
        if (diff < threshold) {
            RapidSubmissionViolation v = new RapidSubmissionViolation();
            v.setUserId(userId);
            v.setContestId(contestId);
            v.setTimestamp(LocalDateTime.ofInstant(Instant.ofEpochMilli(now), ZoneOffset.UTC));
            v.setBlocked(true);
            violationRepository.save(v);
            return false;
        }

        redisTemplate.opsForValue().set(key, String.valueOf(now));
        return true;
    }
}
