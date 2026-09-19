package com.collegecontest.legacy;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.collegecontest.model.ContestParticipant;
import com.collegecontest.model.ContestParticipantId;

import java.util.List;

@Repository("legacyContestParticipantRepository")
public interface ContestParticipantRepository extends CrudRepository<ContestParticipant, ContestParticipantId> {
    @Query(value = "SELECT DISTINCT user_id FROM contest_participants", nativeQuery = true)
    List<Long> findDistinctUserIds();

    @Query(value = "SELECT c.end_date, cp.total_score FROM contest_participants cp JOIN contests c ON cp.contest_id = c.id WHERE cp.user_id = :userId", nativeQuery = true)
    List<Object[]> findByUserIdRaw(@Param("userId") Long userId);
}
