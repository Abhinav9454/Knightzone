package com.collegecontest.voting;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {
    Optional<Vote> findByUserIdAndTargetTypeAndTargetId(Long userId, String targetType, Long targetId);

    @Query(value = "SELECT COALESCE(SUM(vote_value),0) FROM votes WHERE target_type = :targetType AND target_id = :targetId", nativeQuery = true)
    Integer getNetVotes(@Param("targetType") String targetType, @Param("targetId") Long targetId);

    @Query(value = "SELECT COALESCE(SUM(vote_value),0) FROM votes v JOIN submissions s ON v.target_type='SOLUTION' AND v.target_id = s.id WHERE s.user_id = :userId", nativeQuery = true)
    Integer sumNetVotesByUserId(@Param("userId") Long userId);

    @Query(value = "SELECT target_id, COALESCE(SUM(vote_value),0) as net FROM votes WHERE target_type = :targetType AND target_id IN (:ids) GROUP BY target_id", nativeQuery = true)
    List<Object[]> getBulkNetVotes(@Param("targetType") String targetType, @Param("ids") List<Long> ids);
}
