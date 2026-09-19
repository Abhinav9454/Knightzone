package com.collegecontest.typing.repository;

import com.collegecontest.typing.model.TypingBestScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TypingBestScoreRepository extends JpaRepository<TypingBestScore, Long> {
    Optional<TypingBestScore> findByUserId(Long userId);

    List<TypingBestScore> findTop100ByOrderByBestWpmDescBestAccuracyDescBestAchievedAtAsc();

    long countByBestWpmGreaterThan(Integer wpm);
}

