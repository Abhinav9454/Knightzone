package com.collegecontest.ranking;

import com.collegecontest.model.Submission;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository("rankingSubmissionStatsRepository")
public interface SubmissionStatsRepository extends CrudRepository<Submission, Long> {

    @Query(value = "SELECT DISTINCT user_id FROM submissions WHERE contest_id = ?1", nativeQuery = true)
    List<Long> findDistinctUserIdsByContestId(Long contestId);

    @Query(value = "SELECT COUNT(*) FROM submissions WHERE contest_id = ?1 AND user_id = ?2 AND status = 'ACCEPTED'", nativeQuery = true)
    Long countCorrectByContestIdAndUserId(Long contestId, Long userId);

    @Query(value = "SELECT AVG(time_taken_seconds) FROM submissions WHERE contest_id = ?1 AND user_id = ?2 AND status = 'ACCEPTED'", nativeQuery = true)
    Double avgTimeForCorrectByContestIdAndUserId(Long contestId, Long userId);

    @Query(value = "SELECT MIN(created_at) FROM submissions WHERE contest_id = ?1", nativeQuery = true)
    LocalDateTime findEarliestSubmissionTimeForContest(Long contestId);

    @Query(value = "SELECT user_id, COUNT(*) as cnt FROM submissions WHERE status = 'ACCEPTED' GROUP BY user_id ORDER BY cnt DESC LIMIT ?1", nativeQuery = true)
    List<Object[]> findTopCorrectCountsGlobal(int limit);
}
