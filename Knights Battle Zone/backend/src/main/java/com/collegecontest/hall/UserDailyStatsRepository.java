package com.collegecontest.hall;

import com.collegecontest.stats.model.UserDailyStats;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("hallUserDailyStatsRepository")
public interface UserDailyStatsRepository extends CrudRepository<UserDailyStats, Long> {
    // Return user_id, streak_days
    @Query(value = "SELECT user_id, MAX(consecutive_days) as streak FROM user_daily_stats GROUP BY user_id ORDER BY streak DESC LIMIT ?1", nativeQuery = true)
    List<Object[]> findTopStreaks(int limit);
}
