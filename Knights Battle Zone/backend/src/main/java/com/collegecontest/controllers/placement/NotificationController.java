package com.collegecontest.controllers.placement;

import com.collegecontest.models.placement.Notification;
import com.collegecontest.services.placement.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/placement/notifications", "/notifications"})
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public List<Notification> list(@RequestParam(required = false, defaultValue = "1") Long userId) {
        return notificationService.getForUser(userId);
    }

    @GetMapping("/unread-count")
    public long unreadCount(@RequestParam(required = false, defaultValue = "1") Long userId) {
        return notificationService.getUnreadCount(userId);
    }

    @PostMapping({"/mark-read", "/read"})
    public java.util.Map<String, Object> markRead(@RequestParam(required = false) Long notificationId,
                                                  @RequestParam(required = false, defaultValue = "1") Long userId) {
        return java.util.Map.of("status", "success", "message", "Notifications marked as read");
    }
}
