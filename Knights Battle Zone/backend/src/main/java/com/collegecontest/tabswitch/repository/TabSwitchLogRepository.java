package com.collegecontest.tabswitch.repository;

import com.collegecontest.tabswitch.model.TabSwitchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface TabSwitchLogRepository extends JpaRepository<TabSwitchLog, Long> {
    long countByUserIdAndContestIdAndTimestampBetween(Long userId, Long contestId, LocalDateTime start,
            LocalDateTime end);

    void deleteByContestId(Long contestId);
}
