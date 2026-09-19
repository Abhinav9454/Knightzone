package com.collegecontest.hall;

import com.collegecontest.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository("hallSubmissionStatsRepository")
public interface SubmissionStatsRepository extends JpaRepository<Submission, Long> {
    @Query(value = "SELECT user_id, COUNT(*) as cnt FROM submissions WHERE status = 'ACCEPTED' GROUP BY user_id ORDER BY cnt DESC LIMIT ?1", nativeQuery = true)
    List<Object[]> findTopCorrectCountsGlobal(int topN);
}
