package com.collegecontest.duel.repository;

import com.collegecontest.duel.model.DuelFairPlayFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DuelFairPlayFlagRepository extends JpaRepository<DuelFairPlayFlag, Long> {
    List<DuelFairPlayFlag> findByDuelIdOrderByCreatedAtDesc(Long duelId);

    List<DuelFairPlayFlag> findTop20ByReportedUserIdOrderByCreatedAtDesc(Long reportedUserId);

    long countByReportedUserId(Long reportedUserId);

    long countByReportedUserIdAndStatus(Long reportedUserId, String status);

    long countByReporterUserId(Long reporterUserId);
}
