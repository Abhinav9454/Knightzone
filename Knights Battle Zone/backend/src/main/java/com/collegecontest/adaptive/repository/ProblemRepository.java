package com.collegecontest.adaptive.repository;

import com.collegecontest.adaptive.model.Problem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository("adaptiveProblemRepository")
public interface ProblemRepository extends JpaRepository<Problem, Long> {
    
    // Find problems by difficulty range
    List<Problem> findByDifficultyBetween(Double minDifficulty, Double maxDifficulty);
    
    // Find problems by category
    List<Problem> findByCategory(String category);
    
    // Find problems by difficulty less than or equal
    List<Problem> findByDifficultyLessThanEqual(Double maxDifficulty);
    
    // Find problems by difficulty greater than or equal
    List<Problem> findByDifficultyGreaterThanEqual(Double minDifficulty);
    
    // Find problems by category with pagination
    Page<Problem> findByCategory(String category, Pageable pageable);
    
    // Search problems by title (containing)
    List<Problem> findByTitleContainingIgnoreCase(String keyword);
    
    // Get problems for adaptive difficulty (not solved by user)
    @Query("SELECT p FROM AdaptiveProblem p WHERE p.id NOT IN " +
           "(SELECT s.problem.id FROM Submission s WHERE s.user.id = :userId AND s.status = 'ACCEPTED')")
    List<Problem> findUnsolvedProblemsByUser(@Param("userId") Long userId);
    
    // Get problems within specific difficulty range for a user
    @Query("SELECT p FROM AdaptiveProblem p WHERE p.difficulty BETWEEN :minDiff AND :maxDiff " +
           "AND p.id NOT IN (SELECT s.problem.id FROM Submission s WHERE s.user.id = :userId AND s.status = 'ACCEPTED')")
    List<Problem> findUnsolvedProblemsByDifficultyRange(
            @Param("userId") Long userId,
            @Param("minDiff") Double minDiff,
            @Param("maxDiff") Double maxDiff);
    
    // Count problems by category
    Long countByCategory(String category);
    
    // Find random problem
    @Query(value = "SELECT * FROM problems ORDER BY RAND() LIMIT 1", nativeQuery = true)
    Optional<Problem> findRandomProblem();
    
    // Find random problem by difficulty range
    @Query(value = "SELECT * FROM problems WHERE difficulty BETWEEN :minDiff AND :maxDiff ORDER BY RAND() LIMIT 1", 
           nativeQuery = true)
    Optional<Problem> findRandomProblemByDifficultyRange(
            @Param("minDiff") Double minDiff, 
            @Param("maxDiff") Double maxDiff);
}
