package com.collegecontest.duel.repository;

import com.collegecontest.duel.model.Duel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DuelRepository extends JpaRepository<Duel, Long> {
    List<Duel> findByDuelDate(LocalDate date);

    List<Duel> findByDuelDateAndStatus(LocalDate date, String status);

    List<Duel> findByUser1IdOrUser2IdOrderByCreatedAtDesc(Long user1Id, Long user2Id);

    @Query("""
            SELECT d FROM Duel d
            WHERE (d.user1Id = :a AND d.user2Id = :b) OR (d.user1Id = :b AND d.user2Id = :a)
            ORDER BY d.createdAt DESC
            """)
    List<Duel> findBetweenUsers(@Param("a") Long userA, @Param("b") Long userB);

    @Query("""
            SELECT d FROM Duel d
            WHERE d.status = 'ACTIVE'
              AND d.problemId = :problemId
              AND (d.user1Id = :userId OR d.user2Id = :userId)
            ORDER BY d.startedAt DESC
            """)
    List<Duel> findActiveByUserAndProblem(@Param("userId") Long userId, @Param("problemId") Long problemId);

    Optional<Duel> findByIdAndStatus(Long id, String status);

    Optional<Duel> findFirstByStatusAndUser2IdAndModeAndDifficultyOrderByCreatedAtAsc(
            String status,
            Long user2Id,
            String mode,
            String difficulty);

    Optional<Duel> findByInviteCode(String inviteCode);
}
