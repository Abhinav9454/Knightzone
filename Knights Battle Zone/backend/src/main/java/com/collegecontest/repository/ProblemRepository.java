package com.collegecontest.repository;

import com.collegecontest.model.Problem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {
    List<Problem> findByContestId(Long contestId);

    List<Problem> findByContestIdIn(List<Long> contestIds);

    @Query("""
            select (count(p) > 0)
            from Problem p
            where p.id = :problemId
              and p.contest.id = :contestId
            """)
    boolean existsByIdAndContestId(@Param("problemId") Long problemId, @Param("contestId") Long contestId);

    @Query("""
            select p.id as id,
                   p.contest.id as contestId,
                   p.title as title,
                   p.description as description,
                   p.difficulty as difficulty,
                   p.inputFormat as inputFormat,
                   p.outputFormat as outputFormat,
                   p.sampleInput as sampleInput,
                   p.sampleOutput as sampleOutput,
                   p.testCases as testCases,
                   p.points as points
            from Problem p
            where p.contest.id = :contestId
            order by p.id
            """)
    List<ProblemDetailProjection> findProjectedByContestId(@Param("contestId") Long contestId);

    @Query("""
            select p.id
            from Problem p
            where p.contest.id = :contestId
            """)
    List<Long> findIdsByContestId(@Param("contestId") Long contestId);

    @Query("""
            select p
            from Problem p
            where p.contest.id = :contestId
              and (:difficulty is null or upper(p.difficulty) = upper(:difficulty))
              and (:query is null
                   or lower(p.title) like lower(concat('%', :query, '%'))
                   or lower(coalesce(p.description, '')) like lower(concat('%', :query, '%')))
            order by p.id asc
            """)
    Page<Problem> findProblemSetPage(
            @Param("contestId") Long contestId,
            @Param("difficulty") String difficulty,
            @Param("query") String query,
            Pageable pageable);

    interface ProblemDetailProjection {
        Long getId();

        Long getContestId();

        String getTitle();

        String getDescription();

        String getDifficulty();

        String getInputFormat();

        String getOutputFormat();

        String getSampleInput();

        String getSampleOutput();

        String getTestCases();

        Integer getPoints();
    }
}
