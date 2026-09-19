package com.collegecontest.controllers.placement;

import com.collegecontest.models.placement.Notification;
import com.collegecontest.services.placement.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/placement/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public List<Notification> list(@RequestParam Long userId) {
        return notificationService.getForUser(userId);
    }

    @GetMapping("/unread-count")
    public long unreadCount(@RequestParam Long userId) {
        return notificationService.getUnreadCount(userId);
    }
}
