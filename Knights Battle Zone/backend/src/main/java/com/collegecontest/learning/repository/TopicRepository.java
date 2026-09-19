package com.collegecontest.learning.repository;

import com.collegecontest.learning.model.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {
    
    Optional<Topic> findByName(String name);
    
    List<Topic> findByCategory(String category);
    
    @Query("SELECT t FROM Topic t WHERE t.difficultyLevel <= :maxDifficulty")
    List<Topic> findByMaxDifficulty(@Param("maxDifficulty") Integer maxDifficulty);
    
    @Query("SELECT DISTINCT t.category FROM Topic t")
    List<String> findAllCategories();

    List<Topic> findByIdIn(List<Long> ids);

    List<Topic> findByPathTagIgnoreCase(String pathTag);

    @Query("SELECT t FROM Topic t WHERE LOWER(t.pathTag) = LOWER(:pathTag) OR LOWER(t.category) = LOWER(:pathTag)")
    List<Topic> findByPathTagOrCategory(@Param("pathTag") String pathTag);
}

