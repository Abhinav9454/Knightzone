package com.collegecontest.placement;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlacementUserTopicMasteryRepository extends JpaRepository<CompanyRequirement, Long> {

    @Query(value = "SELECT mastery FROM user_topic_mastery WHERE user_id = ?1 AND topic_id = ?2 LIMIT 1", nativeQuery = true)
    Double findMasteryForUserAndTopic(Long userId, Long topicId);

    @Query(value = "SELECT topic_id, mastery FROM user_topic_mastery WHERE user_id = ?1 ORDER BY mastery DESC LIMIT ?2", nativeQuery = true)
    java.util.List<Object[]> findTopTopicsForUser(Long userId, int limit);
}
