package com.collegecontest.tracker.repository;

import com.collegecontest.tracker.model.TrackerPlatform;
import com.collegecontest.tracker.model.UserPlatformConnection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserPlatformConnectionRepository extends JpaRepository<UserPlatformConnection, Long> {
    List<UserPlatformConnection> findByUserId(Long userId);

    Optional<UserPlatformConnection> findByUserIdAndPlatform(Long userId, TrackerPlatform platform);
}

