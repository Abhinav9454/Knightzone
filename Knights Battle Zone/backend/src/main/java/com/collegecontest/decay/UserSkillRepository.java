package com.collegecontest.decay;

import com.collegecontest.adaptive.model.UserSkill;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository("decayUserSkillRepository")
public interface UserSkillRepository extends CrudRepository<UserSkill, Long> {
    @Query(value = "SELECT id, user_id, skill_score FROM user_skill", nativeQuery = true)
    java.util.List<Object[]> findAllUserSkills();

    @Modifying
    @Transactional
    @Query(value = "UPDATE user_skill SET skill_score = :newSkill, last_updated = NOW() WHERE user_id = :userId", nativeQuery = true)
    void updateSkillScore(@Param("userId") Long userId, @Param("newSkill") Double newSkill);
}
