package com.collegecontest.plagiarism.repository;

import com.collegecontest.plagiarism.model.PlagiarismFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface PlagiarismFlagRepository extends JpaRepository<PlagiarismFlag, Long> {
    List<PlagiarismFlag> findByStatus(PlagiarismFlag.Status status);

    boolean existsBySubmissionId1AndSubmissionId2(Long s1, Long s2);

    @Query("""
            SELECT pf FROM PlagiarismFlag pf
            WHERE EXISTS (
                SELECT 1 FROM Submission s
                WHERE s.id = pf.submissionId1
                AND s.problem.contest.id = :contestId
            )
            """)
    List<PlagiarismFlag> findByContestId(@Param("contestId") Long contestId);

    @Modifying
    @Transactional
    @Query("""
            DELETE FROM PlagiarismFlag pf
            WHERE pf.contestId = :contestId
               OR pf.submissionId1 IN (
                    SELECT s.id FROM Submission s WHERE s.problem.contest.id = :contestId
               )
               OR pf.submissionId2 IN (
                    SELECT s.id FROM Submission s WHERE s.problem.contest.id = :contestId
               )
            """)
    void deleteByContestContext(@Param("contestId") Long contestId);
}
