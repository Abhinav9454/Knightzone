package com.collegecontest.mockinterview;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByUserId(Long userId);
    List<Interview> findByUserIdOrInterviewerId(Long userId, Long interviewerId);
    Optional<Interview> findBySessionId(String sessionId);
}
