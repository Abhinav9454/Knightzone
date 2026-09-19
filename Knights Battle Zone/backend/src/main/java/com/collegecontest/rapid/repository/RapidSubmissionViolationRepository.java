package com.collegecontest.rapid.repository;

import com.collegecontest.rapid.model.RapidSubmissionViolation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RapidSubmissionViolationRepository extends JpaRepository<RapidSubmissionViolation, Long> {
}
