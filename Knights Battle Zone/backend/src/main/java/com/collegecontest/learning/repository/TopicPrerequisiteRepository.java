package com.collegecontest.learning.repository;

import com.collegecontest.learning.model.TopicPrerequisite;
import com.collegecontest.learning.model.TopicPrerequisiteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TopicPrerequisiteRepository extends JpaRepository<TopicPrerequisite, TopicPrerequisiteId> {
    
    List<TopicPrerequisite> findByIdTopicId(Long topicId);
    
    List<TopicPrerequisite> findByIdPrerequisiteId(Long prerequisiteId);
    
    boolean existsByIdTopicIdAndIdPrerequisiteId(Long topicId, Long prerequisiteId);

    List<TopicPrerequisite> findByIdTopicIdIn(List<Long> topicIds);

    @Query("SELECT tp.id.prerequisiteId FROM TopicPrerequisite tp WHERE tp.id.topicId = :topicId")
    List<Long> findPrerequisiteIdsByTopicId(@Param("topicId") Long topicId);
}

