package com.collegecontest.club.repository;

import com.collegecontest.club.model.ClubMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClubMemberRepository extends JpaRepository<ClubMember, Long> {
    Optional<ClubMember> findByClubIdAndUserId(Long clubId, Long userId);
    List<ClubMember> findByClubId(Long clubId);
    List<ClubMember> findByUserId(Long userId);
    long countByClubId(Long clubId);
}
