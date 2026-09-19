package com.collegecontest.mockinterview;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewProblemRepository extends JpaRepository<InterviewProblem, InterviewProblemId> {
    List<InterviewProblem> findByInterviewIdOrderByOrderIndex(Long interviewId);
}
