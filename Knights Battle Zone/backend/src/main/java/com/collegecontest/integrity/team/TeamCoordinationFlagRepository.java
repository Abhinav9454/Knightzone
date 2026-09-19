package com.collegecontest.integrity.team;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeamCoordinationFlagRepository extends JpaRepository<TeamCoordinationFlag, Long> {
}
