package com.collegecontest.badge;

import com.collegecontest.badge.dto.BadgeDTO;
import com.collegecontest.badge.dto.UserBadgeDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("")
public class BadgeController {

    private final BadgeService service;

    public BadgeController(BadgeService service) {
        this.service = service;
    }

    @GetMapping("/users/{userId}/badges")
    public ResponseEntity<List<UserBadgeDTO>> getUserBadges(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getUserBadges(userId));
    }

    @GetMapping("/badges")
    public ResponseEntity<List<BadgeDTO>> listAll() {
        return ResponseEntity.ok(service.listAllBadges());
    }
}
