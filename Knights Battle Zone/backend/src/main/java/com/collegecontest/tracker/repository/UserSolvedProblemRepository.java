package com.collegecontest.tracker.repository;

import com.collegecontest.tracker.model.TrackerPlatform;
import com.collegecontest.tracker.model.UserSolvedProblem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface UserSolvedProblemRepository extends JpaRepository<UserSolvedProblem, Long> {
    List<UserSolvedProblem> findByUserId(Long userId);

    List<UserSolvedProblem> findByUserIdAndSolvedAtAfter(Long userId, LocalDateTime solvedAt);

    boolean existsByUserIdAndPlatformAndProblemId(Long userId, TrackerPlatform platform, String problemId);
}

