package com.collegecontest.repository;

import com.collegecontest.model.Quiz;
// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.Pageable;
// import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    boolean existsByTitle(String title);

    // @EntityGraph(attributePaths = { "questions", "questions.options" })
    // Page<Quiz> findAllByOrderByStartTimeDesc(Pageable pageable);
}
