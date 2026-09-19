package com.collegecontest.service.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SimpleNotificationService implements NotificationService {
    private static final Logger logger = LoggerFactory.getLogger(SimpleNotificationService.class);

    @Override
    public void notifyUser(Long userId, String message) {
        // stub: log for now
        logger.info("Notify user {}: {}", userId, message);
    }
}
