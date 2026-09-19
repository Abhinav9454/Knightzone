package com.collegecontest.placement;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlacementTopicRepository extends JpaRepository<CompanyRequirement, Long> {

    @Query(value = "SELECT name FROM topic WHERE id = :id LIMIT 1", nativeQuery = true)
    String findNameById(@Param("id") Long id);
}
