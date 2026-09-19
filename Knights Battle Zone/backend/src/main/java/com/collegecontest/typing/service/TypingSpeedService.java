package com.collegecontest.typing.service;

import com.collegecontest.typing.dto.KeystrokeDTO;
import com.collegecontest.typing.model.KeystrokeLog;
import com.collegecontest.typing.repository.KeystrokeLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.OptionalDouble;

@Service
public class TypingSpeedService {

    private final KeystrokeLogRepository repo;
    private final ObjectMapper mapper = new ObjectMapper();

    // thresholds (milliseconds)
    @Value("${typing.variance.threshold:50}")
    private double varianceThreshold;

    @Value("${typing.avgInterval.threshold:200}")
    private double avgIntervalThreshold;

    public TypingSpeedService(KeystrokeLogRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public void logKeystrokes(Long userId, Long submissionId, List<Integer> intervals) {
        if (intervals == null)
            intervals = List.of();

        double avg = 0.0;
        double variance = 0.0;

        if (!intervals.isEmpty()) {
            DoubleSummaryStatistics stats = intervals.stream().mapToDouble(Integer::doubleValue).summaryStatistics();
            avg = stats.getAverage();
            double mean = avg;
            double varSum = intervals.stream().mapToDouble(i -> (i - mean) * (i - mean)).sum();
            variance = varSum / intervals.size();
        }

        KeystrokeLog log = new KeystrokeLog();
        log.setUserId(userId);
        log.setSubmissionId(submissionId);
        try {
            log.setIntervals(mapper.writeValueAsString(intervals));
        } catch (JsonProcessingException e) {
            log.setIntervals("[]");
        }
        log.setAverageSpeed(avg);
        log.setVariance(variance);
        log.setCreatedAt(LocalDateTime.now());
        repo.save(log);
    }

    public boolean isSuspicious(Long submissionId) {
        return repo.findBySubmissionId(submissionId).stream().anyMatch(l -> {
            Double var = l.getVariance();
            Double avg = l.getAverageSpeed();
            if (var == null)
                var = Double.MAX_VALUE;
            if (avg == null)
                avg = Double.MAX_VALUE;
            boolean lowVariance = var < varianceThreshold;
            boolean veryFast = avg < avgIntervalThreshold; // lower avg interval -> faster typing
            return lowVariance || veryFast;
        });
    }
}
