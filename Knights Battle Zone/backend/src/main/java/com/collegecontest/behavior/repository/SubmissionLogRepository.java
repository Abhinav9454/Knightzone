package com.collegecontest.behavior.repository;

import com.collegecontest.behavior.model.SubmissionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SubmissionLogRepository extends JpaRepository<SubmissionLog, Long> {
    List<SubmissionLog> findByUserIdOrderByTimestampAsc(Long userId);

    List<SubmissionLog> findByUserIdAndTimestampBetweenOrderByTimestampAsc(Long userId, LocalDateTime start,
            LocalDateTime end);
}
