package com.collegecontest.hint.repository;

import com.collegecontest.hint.model.Hint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HintRepository extends JpaRepository<Hint, Long> {
    
    /**
     * Find all hints for a specific problem ordered by unlock order ascending
     * @param problemId the problem ID
     * @return list of hints ordered by unlock order
     */
    List<Hint> findByProblemIdOrderByUnlockOrderAsc(Long problemId);
    
    /**
     * Alternative method if you want descending order
     */
    List<Hint> findByProblemIdOrderByUnlockOrderDesc(Long problemId);
    
    /**
     * Count hints for a problem
     */
    long countByProblemId(Long problemId);
    
    /**
     * Delete all hints for a problem
     */
    void deleteByProblemId(Long problemId);

    /**
     * Batch delete all hints for multiple problems (faster than per-problem loop)
     */
    void deleteByProblemIdIn(List<Long> problemIds);
}
