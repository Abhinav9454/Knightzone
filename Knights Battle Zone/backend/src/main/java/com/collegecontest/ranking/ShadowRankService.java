package com.collegecontest.ranking;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ShadowRankService {

    private final SubmissionStatsRepository submissionStatsRepository;
    private final ShadowRankingRepository shadowRankingRepository;

    public ShadowRankService(SubmissionStatsRepository submissionStatsRepository,
            ShadowRankingRepository shadowRankingRepository) {
        this.submissionStatsRepository = submissionStatsRepository;
        this.shadowRankingRepository = shadowRankingRepository;
    }

    @Transactional
    public void computeShadowRanking(Long contestId) {
        List<Long> users = submissionStatsRepository.findDistinctUserIdsByContestId(contestId);
        if (users == null || users.isEmpty())
            return;

        List<ShadowRanking> toSave = new ArrayList<>();
        for (Long userId : users) {
            Long correct = submissionStatsRepository.countCorrectByContestIdAndUserId(contestId, userId);
            if (correct == null)
                correct = 0L;
            Double avgTime = submissionStatsRepository.avgTimeForCorrectByContestIdAndUserId(contestId, userId);
            if (avgTime == null)
                avgTime = 0.0;
            double metric = correct * avgTime;
            ShadowRanking sr = ShadowRanking.builder()
                    .contestId(contestId)
                    .userId(userId)
                    .metricValue(metric)
                    .computedAt(LocalDateTime.now())
                    .build();
            toSave.add(sr);
        }

        // sort descending by metric (higher is better) and assign ranks
        toSave.sort(Comparator.comparingDouble(ShadowRanking::getMetricValue).reversed());
        int rank = 1;
        for (ShadowRanking sr : toSave) {
            sr.setShadowRank(rank++);
        }

        // replace existing
        shadowRankingRepository.deleteByContestId(contestId);
        shadowRankingRepository.saveAll(toSave);
    }

    public ShadowRankingDTO getShadowRank(Long contestId, Long userId) {
        ShadowRanking sr = shadowRankingRepository.findByContestIdAndUserId(contestId, userId);
        if (sr == null)
            return null;
        return ShadowRankingDTO.builder()
                .userId(sr.getUserId())
                .shadowRank(sr.getShadowRank())
                .metricValue(sr.getMetricValue())
                .build();
    }

    public List<ShadowRankingDTO> getShadowLeaderboard(Long contestId) {
        List<ShadowRanking> list = shadowRankingRepository.findByContestIdOrderByShadowRank(contestId);
        if (list == null)
            return Collections.emptyList();
        return list.stream().map(sr -> ShadowRankingDTO.builder()
                .userId(sr.getUserId())
                .shadowRank(sr.getShadowRank())
                .metricValue(sr.getMetricValue())
                .build()).collect(Collectors.toList());
    }
}
