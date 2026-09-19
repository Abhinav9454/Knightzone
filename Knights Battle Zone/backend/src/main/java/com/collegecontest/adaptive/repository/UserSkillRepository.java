package com.collegecontest.adaptive.repository;

import com.collegecontest.adaptive.model.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository("adaptiveUserSkillRepository")
public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {

    /**
     * Find user skill by user ID
     */
    Optional<UserSkill> findByUserId(Long userId);

    /**
     * Check if user skill exists
     */
    boolean existsByUserId(Long userId);

    /**
     * Delete user skill by user ID
     */
    void deleteByUserId(Long userId);

    /**
     * Get top 10 users by skill (for leaderboard)
     */
    List<UserSkill> findTop10ByOrderBySkillScoreDesc();

    /**
     * Get all users sorted by skill (full leaderboard)
     */
    List<UserSkill> findAllByOrderBySkillScoreDesc();

    /**
     * Get average skill of all users
     */
    @Query("SELECT AVG(u.skillScore) FROM UserSkill u")
    Double getAverageSkill();

    /**
     * Get user's rank based on skill score
     */
    @Query("SELECT COUNT(u) + 1 FROM UserSkill u WHERE u.skillScore > (SELECT u2.skillScore FROM UserSkill u2 WHERE u2.userId = :userId)")
    Long getUserRank(@Param("userId") Long userId);

    /**
     * Update skill score directly
     */
    @Query("UPDATE UserSkill u SET u.skillScore = :newScore, u.lastUpdated = CURRENT_TIMESTAMP WHERE u.userId = :userId")
    void updateSkillScore(@Param("userId") Long userId, @Param("newScore") Double newScore);
}
