package com.collegecontest.stats.repository;

import com.collegecontest.stats.model.UserDailyStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository("statsUserDailyStatsRepository")
public interface UserDailyStatsRepository extends JpaRepository<UserDailyStats, Long> {
    
    Optional<UserDailyStats> findByUserIdAndDate(Long userId, LocalDate date);
    
    List<UserDailyStats> findByUserIdOrderByDateDesc(Long userId);
    
    @Query("SELECT COUNT(u) FROM UserDailyStats u WHERE u.userId = :userId AND u.submissions > 0")
    Long countActiveDaysByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(u) FROM UserDailyStats u WHERE u.userId = :userId")
    Long countTotalDaysByUserId(@Param("userId") Long userId);
    
    @Query("SELECT u FROM UserDailyStats u WHERE u.date >= :startDate")
    List<UserDailyStats> findFromDate(@Param("startDate") LocalDate startDate);
    
    @Query(value = "SELECT user_id, COUNT(*) as streak FROM user_daily_stats WHERE submissions > 0 GROUP BY user_id ORDER BY streak DESC LIMIT ?1", nativeQuery = true)
    List<Object[]> findTopStreaks(int limit);

    List<UserDailyStats> findByUserIdAndDateBetween(Long userId, LocalDate start, LocalDate end);
}

