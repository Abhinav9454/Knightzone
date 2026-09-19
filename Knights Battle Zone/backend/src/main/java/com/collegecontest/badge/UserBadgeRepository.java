package com.collegecontest.badge;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    Optional<UserBadge> findByUserIdAndBadgeId(Long userId, Long badgeId);

    List<UserBadge> findByUserId(Long userId);
}
