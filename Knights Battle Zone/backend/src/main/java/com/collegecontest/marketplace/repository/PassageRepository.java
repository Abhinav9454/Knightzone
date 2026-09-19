package com.collegecontest.marketplace.repository;

import com.collegecontest.marketplace.model.Passage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface PassageRepository extends JpaRepository<Passage, Long> {

    @Query("""
            SELECT p
            FROM Passage p
            WHERE p.approved = true
              AND (:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%'))
                               OR LOWER(p.content) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:tag IS NULL OR EXISTS (
                    SELECT t.id FROM PassageTag t
                    WHERE t.passage = p AND LOWER(t.tag) = LOWER(:tag)
              ))
            ORDER BY p.createdAt DESC
            """)
    Page<Passage> findApproved(String search, String tag, Pageable pageable);

    @Query("""
            SELECT p
            FROM Passage p
            WHERE p.approved = true
              AND p.featured = true
              AND (:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%'))
                               OR LOWER(p.content) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:tag IS NULL OR EXISTS (
                    SELECT t.id FROM PassageTag t
                    WHERE t.passage = p AND LOWER(t.tag) = LOWER(:tag)
              ))
            ORDER BY p.updatedAt DESC, p.createdAt DESC
            """)
    Page<Passage> findFeatured(String search, String tag, Pageable pageable);

    @Query("""
            SELECT p
            FROM Passage p
            WHERE p.author.id = :authorId
            ORDER BY p.createdAt DESC
            """)
    Page<Passage> findMine(Long authorId, Pageable pageable);

    @Query(value = """
            SELECT p.* FROM passages p
            WHERE p.approved = 1
              AND (:search IS NULL OR LOWER(p.title) LIKE CONCAT('%', LOWER(:search), '%')
                                 OR LOWER(p.content) LIKE CONCAT('%', LOWER(:search), '%'))
              AND (:tag IS NULL OR EXISTS (
                    SELECT 1 FROM passage_tags pt
                    WHERE pt.passage_id = p.id AND LOWER(pt.tag) = LOWER(:tag)
              ))
            ORDER BY
            (
                (0.40 * LOG(1 + (COALESCE(p.play_count, 0) * EXP(-TIMESTAMPDIFF(HOUR, COALESCE(p.last_played_at, p.created_at), NOW()) / 168.0))))
              + (0.30 * (COALESCE(p.average_rating, 0) / 5.0))
              + (0.20 * (CASE
                         WHEN COALESCE(p.play_count, 0) = 0 THEN 0
                         ELSE LEAST(1.0, COALESCE(p.completion_count, 0) / p.play_count)
                         END))
              + (0.10 * EXP(-TIMESTAMPDIFF(HOUR, p.updated_at, NOW()) / 72.0))
            ) DESC,
            p.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM passages p
            WHERE p.approved = 1
              AND (:search IS NULL OR LOWER(p.title) LIKE CONCAT('%', LOWER(:search), '%')
                                 OR LOWER(p.content) LIKE CONCAT('%', LOWER(:search), '%'))
              AND (:tag IS NULL OR EXISTS (
                    SELECT 1 FROM passage_tags pt
                    WHERE pt.passage_id = p.id AND LOWER(pt.tag) = LOWER(:tag)
              ))
            """,
            nativeQuery = true)
    Page<Passage> findTrending(String search, String tag, Pageable pageable);
}

