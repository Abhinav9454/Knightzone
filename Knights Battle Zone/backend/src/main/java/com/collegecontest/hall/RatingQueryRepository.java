package com.collegecontest.hall;

import com.collegecontest.adaptive.model.UserSkill;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RatingQueryRepository extends CrudRepository<UserSkill, Long> {
    @Query(value = "SELECT user_id, skill_score FROM user_skill ORDER BY skill_score DESC LIMIT ?1", nativeQuery = true)
    List<Object[]> findTopBySkillScore(int limit);
}
