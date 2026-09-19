package com.collegecontest.hint.repository;

import com.collegecontest.hint.model.UserProblemAttempts;
import com.collegecontest.hint.model.UserProblemAttemptsId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserProblemAttemptsRepository extends JpaRepository<UserProblemAttempts, UserProblemAttemptsId> {
    
    /**
     * Find attempts by userId and problemId
     */
    @Query("SELECT upa FROM UserProblemAttempts upa WHERE upa.id.userId = :userId AND upa.id.problemId = :problemId")
    Optional<UserProblemAttempts> findByUserIdAndProblemId(@Param("userId") Long userId,
            @Param("problemId") Long problemId);

    @Query("SELECT upa FROM UserProblemAttempts upa WHERE upa.id.userId = :userId AND upa.id.problemId = :problemId")
    Optional<UserProblemAttempts> findByIdUserIdAndIdProblemId(@Param("userId") Long userId,
            @Param("problemId") Long problemId);
    
    /**
     * Alternative using the embedded ID
     */
    Optional<UserProblemAttempts> findById(UserProblemAttemptsId id);
    
    /**
     * Check if a user has attempted a problem
     */
    @Query("SELECT COUNT(upa) > 0 FROM UserProblemAttempts upa WHERE upa.id.userId = :userId AND upa.id.problemId = :problemId")
    boolean existsByUserIdAndProblemId(@Param("userId") Long userId, @Param("problemId") Long problemId);
    
    /**
     * Delete all attempts for a user
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM UserProblemAttempts upa WHERE upa.id.userId = :userId")
    void deleteByUserId(@Param("userId") Long userId);
    
    /**
     * Delete all attempts for a problem
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM UserProblemAttempts upa WHERE upa.id.problemId = :problemId")
    void deleteByProblemId(@Param("problemId") Long problemId);

    /**
     * Batch delete attempts for multiple problems
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM UserProblemAttempts upa WHERE upa.id.problemId IN :problemIds")
    void deleteByProblemIdIn(@Param("problemIds") List<Long> problemIds);
}
