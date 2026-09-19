package com.collegecontest.decay;

import com.collegecontest.model.Submission;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SubmissionActivityRepository extends CrudRepository<Submission, Long> {
    @Query(value = "SELECT t.user_id FROM (SELECT user_id, MAX(created_at) as last FROM submissions GROUP BY user_id) t WHERE t.last < :cutoff", nativeQuery = true)
    List<Long> findUserIdsLastActiveBefore(@Param("cutoff") LocalDateTime cutoff);
}
