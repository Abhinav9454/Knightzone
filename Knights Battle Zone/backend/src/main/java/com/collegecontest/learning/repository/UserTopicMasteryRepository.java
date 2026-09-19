package com.collegecontest.learning.repository;

import com.collegecontest.learning.model.UserTopicMastery;
import com.collegecontest.learning.model.UserTopicMasteryId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserTopicMasteryRepository extends JpaRepository<UserTopicMastery, UserTopicMasteryId> {

    @Query("SELECT utm FROM UserTopicMastery utm WHERE utm.id.userId = :userId")
    List<UserTopicMastery> findByUserId(@Param("userId") Long userId);

    List<UserTopicMastery> findByIdUserId(Long userId);

    @Query("SELECT utm FROM UserTopicMastery utm WHERE utm.id.userId = :userId AND utm.masteryScore < :threshold ORDER BY utm.masteryScore ASC")
    List<UserTopicMastery> findWeakTopics(@Param("userId") Long userId, @Param("threshold") double threshold);

    Optional<UserTopicMastery> findByIdUserIdAndIdTopicId(Long userId, Long topicId);

    @Query("SELECT utm FROM UserTopicMastery utm WHERE utm.id.userId = :userId AND utm.masteryScore < :threshold")
    List<UserTopicMastery> findByIdUserIdAndMasteryScoreLessThan(@Param("userId") Long userId,
            @Param("threshold") double threshold);
    
    @Query("SELECT utm FROM UserTopicMastery utm WHERE utm.id.userId = :userId ORDER BY utm.masteryScore ASC")
    List<UserTopicMastery> findWeakestTopics(@Param("userId") Long userId);
    
    @Query("SELECT AVG(utm.masteryScore) FROM UserTopicMastery utm WHERE utm.id.userId = :userId")
    Double getAverageMasteryScore(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(utm) FROM UserTopicMastery utm WHERE utm.id.userId = :userId AND utm.masteryScore >= 80.0")
    Long countMasteredTopics(@Param("userId") Long userId);

    @Query("SELECT utm FROM UserTopicMastery utm WHERE utm.id.userId = :userId AND utm.masteryScore < :threshold")
    List<UserTopicMastery> findByUserIdAndMasteryScoreLessThan(@Param("userId") Long userId,
            @Param("threshold") double threshold);
}


