package com.collegecontest.resume;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ResumeMetricsRepository extends JpaRepository<UserProfile, Long> {

    @Query(value = "SELECT COUNT(DISTINCT problem_id) FROM submissions WHERE user_id = :userId AND status = 'ACCEPTED'", nativeQuery = true)
    Integer countDistinctSolved(@Param("userId") Long userId);

    @Query(value = "SELECT COALESCE(MAX(p.difficulty),0) FROM submissions s JOIN problem p ON s.problem_id = p.id WHERE s.user_id = :userId AND s.status = 'ACCEPTED'", nativeQuery = true)
    Integer maxDifficultySolved(@Param("userId") Long userId);

    @Query(value = "SELECT COUNT(DISTINCT cp.contest_id) FROM contest_participants cp JOIN contest c ON cp.contest_id = c.id WHERE cp.user_id = :userId AND c.end_date >= :since", nativeQuery = true)
    Integer contestsInPeriod(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    @Query(value = "SELECT COUNT(*) FROM user_badges WHERE user_id = :userId", nativeQuery = true)
    Integer countBadges(@Param("userId") Long userId);

    @Query(value = "SELECT COALESCE(MAX(consecutive_days),0) FROM user_daily_stats WHERE user_id = :userId", nativeQuery = true)
    Integer longestStreak(@Param("userId") Long userId);
}
