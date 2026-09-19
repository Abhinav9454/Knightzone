package com.collegecontest.typing.repository;

import com.collegecontest.typing.model.TypingTestResult;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TypingTestResultRepository extends JpaRepository<TypingTestResult, Long> {

    List<TypingTestResult> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("""
            SELECT r FROM TypingTestResult r
            WHERE (:mode = 'ALL' OR r.mode = :mode)
              AND r.createdAt >= :from
            ORDER BY r.wpm DESC, r.accuracy DESC, r.createdAt ASC
            """)
    List<TypingTestResult> findLeaderboardCandidates(String mode, LocalDateTime from, Pageable pageable);

    @Query("""
            SELECT r.textSnippet, COUNT(r)
            FROM TypingTestResult r
            WHERE r.textSnippet IS NOT NULL
              AND r.textSnippet <> ''
            GROUP BY r.textSnippet
            ORDER BY COUNT(r) DESC
            """)
    List<Object[]> findTopTextSnippets(Pageable pageable);

    @Query("""
            SELECT COALESCE(MAX(r.wpm), 0)
            FROM TypingTestResult r
            WHERE r.userId = :userId
            """)
    Integer findBestWpmByUserId(Long userId);
}
