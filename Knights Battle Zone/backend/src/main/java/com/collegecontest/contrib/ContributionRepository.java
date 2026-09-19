package com.collegecontest.contrib;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

import java.util.List;

@Repository
public interface ContributionRepository extends JpaRepository<Contribution, Long> {
    @Query(value = "SELECT COALESCE(SUM(points),0) FROM contributions WHERE user_id = ?1", nativeQuery = true)
    Integer sumPointsByUserId(Long userId);

    @Query(value = "SELECT COALESCE(SUM(points),0) FROM contributions WHERE user_id = ?1 AND created_at >= ?2", nativeQuery = true)
    Integer sumPointsByUserIdSince(Long userId, LocalDateTime since);

    long countByUserId(Long userId);

    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime after);

    List<Contribution> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query(value = "SELECT type, COUNT(*) as cnt, COALESCE(SUM(points),0) as total FROM contributions WHERE user_id = ?1 GROUP BY type ORDER BY total DESC", nativeQuery = true)
    List<Object[]> findTypeBreakdownByUserId(Long userId);

    @Query(value = "SELECT c.user_id as userId, "
            + "COALESCE(NULLIF(u.username, ''), u.name, CONCAT('User-', c.user_id)) as username, "
            + "COALESCE(SUM(c.points),0) as totalPoints, "
            + "COUNT(*) as contributionsCount, "
            + "MAX(c.created_at) as lastContributionAt "
            + "FROM contributions c "
            + "LEFT JOIN users u ON u.id = c.user_id "
            + "GROUP BY c.user_id, u.username, u.name "
            + "ORDER BY totalPoints DESC, contributionsCount DESC, lastContributionAt ASC "
            + "LIMIT ?1", nativeQuery = true)
    List<Object[]> findTopContributorsDetailed(int limit);
}
