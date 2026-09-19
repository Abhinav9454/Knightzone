package com.collegecontest.team.repository;

import com.collegecontest.team.model.TeamMember;
import com.collegecontest.team.model.TeamMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, TeamMemberId> {
    List<TeamMember> findByTeamId(Long teamId);

    List<TeamMember> findByUserId(Long userId);
}
