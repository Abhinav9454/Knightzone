package com.collegecontest.intercollege;

import com.collegecontest.model.ContestParticipant;
import com.collegecontest.model.ContestParticipantId;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository("interCollegeContestParticipantRepository")
public interface ContestParticipantRepository extends CrudRepository<ContestParticipant, ContestParticipantId> {
    @Query(value = "SELECT COALESCE(total_score,0) FROM contest_participants WHERE contest_id = :contestId AND user_id = :userId", nativeQuery = true)
    Double findTotalScoreByContestAndUser(@Param("contestId") Long contestId, @Param("userId") Long userId);
}
