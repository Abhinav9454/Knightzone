package com.collegecontest.ranking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShadowRankingRepository extends JpaRepository<ShadowRanking, Long> {
    List<ShadowRanking> findByContestIdOrderByShadowRank(Long contestId);

    ShadowRanking findByContestIdAndUserId(Long contestId, Long userId);

    void deleteByContestId(Long contestId);
}
