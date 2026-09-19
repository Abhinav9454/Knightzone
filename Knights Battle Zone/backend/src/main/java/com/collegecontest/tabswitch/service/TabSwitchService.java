package com.collegecontest.tabswitch.service;

import com.collegecontest.tabswitch.model.TabSwitchLog;
import com.collegecontest.tabswitch.repository.TabSwitchLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class TabSwitchService {

    private final TabSwitchLogRepository repo;

    public TabSwitchService(TabSwitchLogRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public void logSwitch(Long userId, Long contestId) {
        TabSwitchLog l = new TabSwitchLog();
        l.setUserId(userId);
        l.setContestId(contestId);
        l.setTimestamp(LocalDateTime.now());
        repo.save(l);
    }

    public int countSwitches(Long userId, Long contestId) {
        long count = repo.countByUserIdAndContestIdAndTimestampBetween(userId, contestId, LocalDateTime.MIN,
                LocalDateTime.MAX);
        return (int) count;
    }

    public boolean shouldPenalize(Long userId, Long contestId, int threshold) {
        return countSwitches(userId, contestId) > threshold;
    }
}
