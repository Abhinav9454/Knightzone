package com.collegecontest.typing.repository;

import com.collegecontest.typing.model.TypingText;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TypingTextRepository extends JpaRepository<TypingText, Long> {
    List<TypingText> findByActiveTrue(Pageable pageable);

    List<TypingText> findByActiveTrueAndCategoryIgnoreCase(String category, Pageable pageable);

    List<TypingText> findByActiveTrueAndDifficultyIgnoreCase(String difficulty, Pageable pageable);

    List<TypingText> findByActiveTrueAndCategoryIgnoreCaseAndDifficultyIgnoreCase(String category, String difficulty, Pageable pageable);

    @Query("SELECT DISTINCT t.category FROM TypingText t WHERE t.active = true ORDER BY t.category ASC")
    List<String> findDistinctActiveCategories();
}
