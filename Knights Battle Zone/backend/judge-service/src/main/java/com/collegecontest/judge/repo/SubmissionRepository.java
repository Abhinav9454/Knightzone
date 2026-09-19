package com.collegecontest.judge.repo;

import com.collegecontest.judge.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SubmissionRepository extends JpaRepository<Submission, String> {
    java.util.List<Submission> findByProblemIdAndStatus(Long problemId, String status);

    @Query("select distinct s.problemId from Submission s where s.status = :status")
    java.util.List<Long> findDistinctProblemIdsByStatus(@Param("status") String status);
}
