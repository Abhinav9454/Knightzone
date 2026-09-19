package com.collegecontest.bonus.repository;

import com.collegecontest.bonus.model.SubmissionBonus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;

@Repository
public interface SubmissionBonusRepository extends JpaRepository<SubmissionBonus, Long> {
    void deleteByContestId(Long contestId);

    void deleteBySubmissionIdIn(Collection<Long> submissionIds);
}
