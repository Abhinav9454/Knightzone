package com.collegecontest.team.repository;

import com.collegecontest.team.model.TeamContestScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeamContestScoreRepository extends JpaRepository<TeamContestScore, Long> {
    Optional<TeamContestScore> findByTeamIdAndContestId(Long teamId, Long contestId);
}
