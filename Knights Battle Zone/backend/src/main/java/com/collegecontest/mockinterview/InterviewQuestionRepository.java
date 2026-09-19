package com.collegecontest.mockinterview;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {
    List<InterviewQuestion> findByIsActiveTrueOrderByCreatedAtDesc();

    List<InterviewQuestion> findByTypeAndDifficultyAndIsActiveTrue(String type, String difficulty);

    List<InterviewQuestion> findByTypeAndIsActiveTrue(String type);

    List<InterviewQuestion> findByTypeAndDifficultyAndQuestionFormatAndIsActiveTrue(String type, String difficulty, String questionFormat);

    List<InterviewQuestion> findByTypeAndQuestionFormatAndIsActiveTrue(String type, String questionFormat);

    List<InterviewQuestion> findByQuestionFormatAndIsActiveTrueOrderByCreatedAtDesc(String questionFormat);

    long countByIsActiveTrue();
    long countByTypeAndIsActiveTrue(String type);
    long countByDifficultyAndIsActiveTrue(String difficulty);
    long countByQuestionFormatAndIsActiveTrue(String questionFormat);

    @Query("""
            select q from InterviewQuestion q
            where q.isActive = true
              and (:type is null or q.type = :type)
              and (:difficulty is null or q.difficulty = :difficulty)
              and (:questionFormat is null or q.questionFormat = :questionFormat)
              and (:category is null or lower(q.category) = lower(:category))
              and (
                    :search is null
                    or lower(q.question) like lower(concat('%', :search, '%'))
                    or lower(coalesce(q.tags, '')) like lower(concat('%', :search, '%'))
                    or lower(coalesce(q.companyTag, '')) like lower(concat('%', :search, '%'))
                  )
            """)
    Page<InterviewQuestion> searchActive(
            @Param("type") String type,
            @Param("difficulty") String difficulty,
            @Param("questionFormat") String questionFormat,
            @Param("category") String category,
            @Param("search") String search,
            Pageable pageable
    );
}
