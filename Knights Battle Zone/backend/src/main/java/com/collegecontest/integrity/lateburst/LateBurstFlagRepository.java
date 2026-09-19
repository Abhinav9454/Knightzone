package com.collegecontest.integrity.lateburst;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LateBurstFlagRepository extends JpaRepository<LateBurstFlag, Long> {
}
