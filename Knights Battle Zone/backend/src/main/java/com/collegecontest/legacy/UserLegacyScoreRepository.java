package com.collegecontest.legacy;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserLegacyScoreRepository extends JpaRepository<UserLegacyScore, Long> {
}
