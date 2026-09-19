package com.collegecontest.club.repository;

import com.collegecontest.club.model.ClubMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClubMessageRepository extends JpaRepository<ClubMessage, Long> {
    List<ClubMessage> findTop200ByClubIdAndDeletedFalseOrderByCreatedAtDesc(Long clubId);
}
