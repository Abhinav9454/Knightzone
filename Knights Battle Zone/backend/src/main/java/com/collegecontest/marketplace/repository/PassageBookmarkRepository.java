package com.collegecontest.marketplace.repository;

import com.collegecontest.marketplace.model.PassageBookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PassageBookmarkRepository extends JpaRepository<PassageBookmark, Long> {
    Optional<PassageBookmark> findByPassageIdAndUserId(Long passageId, Long userId);
    boolean existsByPassageIdAndUserId(Long passageId, Long userId);
}

