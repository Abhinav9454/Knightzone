package com.collegecontest.tracker.scheduler;

import com.collegecontest.tracker.service.TrackerSyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class TrackerSyncScheduler {
    private static final Logger logger = LoggerFactory.getLogger(TrackerSyncScheduler.class);

    private final TrackerSyncService trackerSyncService;

    public TrackerSyncScheduler(TrackerSyncService trackerSyncService) {
        this.trackerSyncService = trackerSyncService;
    }

    @Scheduled(cron = "${tracker.sync.cron:0 0 2 * * ?}")
    public void syncAllConnections() {
        try {
            var responses = trackerSyncService.syncAllUsersAllPlatforms();
            long failed = responses.stream().filter(response -> !response.isSuccess()).count();
            logger.info("Tracker nightly sync finished. total={}, failed={}", responses.size(), failed);
        } catch (Exception ex) {
            logger.error("Tracker nightly sync failed", ex);
        }
    }
}

