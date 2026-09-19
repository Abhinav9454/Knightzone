package com.collegecontest.club.repository;

import com.collegecontest.club.model.ClubChallengeAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClubChallengeAttemptRepository extends JpaRepository<ClubChallengeAttempt, Long> {
    List<ClubChallengeAttempt> findByChallengeClubId(Long clubId);
    List<ClubChallengeAttempt> findByChallengeId(Long challengeId);
}
