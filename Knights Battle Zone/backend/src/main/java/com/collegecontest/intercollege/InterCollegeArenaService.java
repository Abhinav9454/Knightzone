package com.collegecontest.intercollege;

import com.collegecontest.ranking.SubmissionStatsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InterCollegeArenaService {

    private final SubmissionStatsRepository submissionStatsRepository;
    private final UserCollegeRepository userCollegeRepository;
    private final ContestParticipantRepository contestParticipantRepository;
    private final CollegeRankingRepository collegeRankingRepository;

    public InterCollegeArenaService(SubmissionStatsRepository submissionStatsRepository,
            UserCollegeRepository userCollegeRepository,
            ContestParticipantRepository contestParticipantRepository,
            CollegeRankingRepository collegeRankingRepository) {
        this.submissionStatsRepository = submissionStatsRepository;
        this.userCollegeRepository = userCollegeRepository;
        this.contestParticipantRepository = contestParticipantRepository;
        this.collegeRankingRepository = collegeRankingRepository;
    }

    @Transactional
    public void updateCollegeRankings(Long contestId) {
        List<Long> users = submissionStatsRepository.findDistinctUserIdsByContestId(contestId);
        if (users == null || users.isEmpty())
            return;

        Map<Long, Double> collegeTotals = new HashMap<>();
        for (Long uid : users) {
            Long collegeId = userCollegeRepository.findCollegeIdByUserId(uid);
            if (collegeId == null)
                continue;
            Double score = contestParticipantRepository.findTotalScoreByContestAndUser(contestId, uid);
            if (score == null)
                score = 0.0;
            collegeTotals.merge(collegeId, score, Double::sum);
        }

        LocalDate month = LocalDate.now().withDayOfMonth(1);
        List<CollegeRanking> results = new ArrayList<>();
        for (Map.Entry<Long, Double> e : collegeTotals.entrySet()) {
            results.add(CollegeRanking.builder()
                    .collegeId(e.getKey())
                    .month(month)
                    .totalScore(e.getValue())
                    .lastUpdated(LocalDateTime.now())
                    .build());
        }

        results.sort(Comparator.comparingDouble(CollegeRanking::getTotalScore).reversed());
        int r = 1;
        for (CollegeRanking cr : results)
            cr.setRank(r++);

        collegeRankingRepository.deleteByMonth(month);
        collegeRankingRepository.saveAll(results);
    }

    public List<CollegeRanking> getCurrentMonthRankings() {
        return collegeRankingRepository.findByMonthOrderByRank(LocalDate.now().withDayOfMonth(1));
    }
}
