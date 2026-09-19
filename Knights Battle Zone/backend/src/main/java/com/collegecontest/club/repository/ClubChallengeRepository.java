package com.collegecontest.club.repository;

import com.collegecontest.club.model.ClubChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClubChallengeRepository extends JpaRepository<ClubChallenge, Long> {
    List<ClubChallenge> findByClubIdOrderByStartsAtDesc(Long clubId);
}
