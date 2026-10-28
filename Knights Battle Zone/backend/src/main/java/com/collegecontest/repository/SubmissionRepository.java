package com.collegecontest.repository;

import com.collegecontest.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByUserIdAndProblemId(Long userId, Long problemId);

    List<Submission> findByProblemIdOrderBySubmittedAtDesc(Long problemId);

    List<Submission> findByUserIdOrderBySubmittedAtDesc(Long userId);

    @Query("""
            SELECT s
            FROM Submission s
            LEFT JOIN FETCH s.problem p
            LEFT JOIN FETCH p.contest
            WHERE s.user.id = :userId
            ORDER BY s.submittedAt DESC
            """)
    List<Submission> findByUserIdWithProblemAndContestOrderBySubmittedAtDesc(@Param("userId") Long userId);

    long countByUserId(Long userId);

    List<Submission> findByUserIdAndSubmittedAtBetween(Long userId, java.time.LocalDateTime start,
            java.time.LocalDateTime end);

    @Query("SELECT COUNT(s) FROM Submission s WHERE s.user.id = :userId AND UPPER(s.status) = 'ACCEPTED'")
    long countAcceptedByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(DISTINCT s.problem.id) FROM Submission s WHERE s.user.id = :userId AND UPPER(s.status) = 'ACCEPTED'")
    long countDistinctAcceptedProblemsByUserId(@Param("userId") Long userId);

    @Query("""
            SELECT UPPER(COALESCE(s.problem.difficulty, 'MEDIUM')), COUNT(s)
            FROM Submission s
            WHERE s.user.id = :userId AND UPPER(s.status) = 'ACCEPTED'
            GROUP BY UPPER(COALESCE(s.problem.difficulty, 'MEDIUM'))
            """)
    List<Object[]> countAcceptedByDifficulty(@Param("userId") Long userId);

    @Query("SELECT DISTINCT s.user.id FROM Submission s WHERE s.problem.contest.id = :contestId")
    List<Long> findDistinctUserIdsByContestId(@Param("contestId") Long contestId);

    @Query("SELECT s FROM Submission s WHERE s.problem.contest.id = :contestId")
    List<Submission> findByContestId(@Param("contestId") Long contestId);

    @Query("SELECT s.id FROM Submission s WHERE s.problem.contest.id = :contestId")
    List<Long> findIdsByContestId(@Param("contestId") Long contestId);

    @Query("SELECT s FROM Submission s WHERE s.problem.contest.id = :contestId AND s.user.id IN :userIds")
    List<Submission> findByContestIdAndUserIdIn(@Param("contestId") Long contestId, @Param("userIds") List<Long> userIds);

    @Query("SELECT COUNT(s) FROM Submission s WHERE s.user.id = :userId AND s.problem.contest.id = :contestId AND s.submittedAt < :cutoffTime")
    long countByUserIdAndContestIdAndCreatedAtBefore(@Param("userId") Long userId,
            @Param("contestId") Long contestId,
            @Param("cutoffTime") LocalDateTime cutoffTime);

    @Query("SELECT MIN(s.submittedAt) FROM Submission s WHERE s.problem.contest.id = :contestId")
    LocalDateTime findEarliestSubmissionTimeByContestId(@Param("contestId") Long contestId);

    List<Submission> findTop20ByStatusOrderBySubmittedAtAsc(String status);

    List<Submission> findByStatusOrderBySubmittedAtAsc(String status, Pageable pageable);

    Optional<Submission> findFirstByJudgeSubmissionId(String judgeSubmissionId);

    @Modifying
    @Query("DELETE FROM Submission s WHERE s.problem.contest.id = :contestId")
    void deleteByContestId(@Param("contestId") Long contestId);

    @Query(value = "SELECT DATE(submitted_at) as sub_date, COUNT(*) as cnt " +
            "FROM submissions " +
            "WHERE user_id = :userId AND submitted_at >= :since " +
            "GROUP BY DATE(submitted_at)", nativeQuery = true)
    List<Object[]> countDailySubmissionsByUserId(@Param("userId") Long userId, @Param("since") LocalDateTime since);
}
