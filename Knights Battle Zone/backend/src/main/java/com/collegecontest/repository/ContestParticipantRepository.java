package com.collegecontest.repository;

import com.collegecontest.model.ContestParticipant;
import com.collegecontest.model.ContestParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContestParticipantRepository extends JpaRepository<ContestParticipant, ContestParticipantId> {
    Optional<ContestParticipant> findByContestIdAndUserId(Long contestId, Long userId);

    java.util.List<ContestParticipant> findByContestIdOrderByTotalScoreDesc(Long contestId);

    long countByContestId(Long contestId);

    long countByUserId(Long userId);

    @Modifying
    @Query("update ContestParticipant p set p.eliminated = :eliminated where p.contestId = :contestId and p.userId = :userId")
    int updateEliminatedByContestIdAndUserId(Long contestId, Long userId, boolean eliminated);

    @Modifying
    @Query("update ContestParticipant p set p.totalScore = :score where p.contestId = :contestId and p.userId = :userId")
    int updateTotalScoreByContestIdAndUserId(Long contestId, Long userId, double score);

    @Query("""
            select p.contestId as contestId, count(p) as participantCount
            from ContestParticipant p
            where p.contestId in :contestIds
            group by p.contestId
            """)
    List<ContestParticipantCountProjection> countParticipantsByContestIds(@Param("contestIds") List<Long> contestIds);

    void deleteByContestId(Long contestId);

    interface ContestParticipantCountProjection {
        Long getContestId();

        long getParticipantCount();
    }
}
