package com.collegecontest.marketplace.repository;

import com.collegecontest.marketplace.model.PassageRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PassageRatingRepository extends JpaRepository<PassageRating, Long> {
    Optional<PassageRating> findByPassageIdAndUserId(Long passageId, Long userId);
    long countByPassageId(Long passageId);

    @Query("""
            SELECT COALESCE(AVG(r.rating), 0), COUNT(r), COALESCE(SUM(CASE WHEN r.completed = true THEN 1 ELSE 0 END), 0)
            FROM PassageRating r
            WHERE r.passage.id = :passageId
            """)
    Object[] findRatingStats(Long passageId);
}
