package com.collegecontest.club.repository;

import com.collegecontest.club.model.ClubPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClubPostRepository extends JpaRepository<ClubPost, Long> {
    List<ClubPost> findByClubIdAndDeletedFalseOrderByCreatedAtDesc(Long clubId);
}
