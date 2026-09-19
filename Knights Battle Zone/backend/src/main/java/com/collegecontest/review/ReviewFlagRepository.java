package com.collegecontest.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewFlagRepository extends JpaRepository<ReviewFlag, Long> {
    List<ReviewFlag> findByStatus(String status);

    List<ReviewFlag> findBySubmissionId(Long submissionId);

    void deleteBySubmissionIdIn(List<Long> submissionIds);
}
