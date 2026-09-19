package com.collegecontest.repository;

import com.collegecontest.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findByQuizAttemptId(Long quizAttemptId);

    @Modifying
    @Transactional
    @Query("delete from Answer a where a.quizAttempt.quiz.id = :quizId")
    void deleteByQuizId(@Param("quizId") Long quizId);
}
