package com.collegecontest.repository;

import com.collegecontest.model.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByUserId(Long userId);

    List<QuizAttempt> findByQuizId(Long quizId);

    Optional<QuizAttempt> findByUserIdAndQuizId(Long userId, Long quizId);

    @Modifying
    @Query("delete from QuizAttempt qa where qa.quiz.id = :quizId")
    void deleteByQuizId(@Param("quizId") Long quizId);
}
