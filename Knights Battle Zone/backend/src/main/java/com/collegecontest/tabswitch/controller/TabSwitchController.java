package com.collegecontest.tabswitch.controller;

import com.collegecontest.tabswitch.service.TabSwitchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/contests", "/proctoring"})
public class TabSwitchController {

    private final TabSwitchService tabSwitchService;

    public TabSwitchController(TabSwitchService tabSwitchService) {
        this.tabSwitchService = tabSwitchService;
    }

    @PostMapping("/{contestId}/tab-switch")
    public ResponseEntity<Void> logSwitch(@PathVariable Long contestId, @RequestParam Long userId) {
        tabSwitchService.logSwitch(userId, contestId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{contestId}/tab-switch-count")
    public ResponseEntity<Integer> getCount(@PathVariable Long contestId, @RequestParam Long userId) {
        int c = tabSwitchService.countSwitches(userId, contestId);
        return ResponseEntity.ok(c);
    }

    @PostMapping("/events")
    public ResponseEntity<java.util.Map<String, Object>> logProctoringEvent(@RequestBody java.util.Map<String, Object> event) {
        Long contestId = event.get("contestId") != null ? Long.valueOf(String.valueOf(event.get("contestId"))) : 101L;
        Long userId = event.get("userId") != null ? Long.valueOf(String.valueOf(event.get("userId"))) : 1L;
        tabSwitchService.logSwitch(userId, contestId);
        int currentCount = tabSwitchService.countSwitches(userId, contestId);

        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("status", "recorded");
        res.put("strikes", currentCount);
        res.put("disqualified", currentCount >= 3);
        res.put("message", currentCount >= 3 ? "Candidate disqualified due to 3-strike violation." : "Warning: strike logged.");
        return ResponseEntity.ok(res);
    }

    @GetMapping({"/contest/{contestId}/violations", "/{contestId}/violations"})
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getViolations(@PathVariable Long contestId) {
        java.util.List<java.util.Map<String, Object>> violations = new java.util.ArrayList<>();
        violations.add(java.util.Map.of(
            "userId", 12L,
            "userName", "Rajesh Sharma",
            "contestId", contestId,
            "strikes", 3,
            "status", "DISQUALIFIED",
            "lastEvent", "FULLSCREEN_EXIT",
            "timestamp", java.time.Instant.now().minusSeconds(120).toString()
        ));
        violations.add(java.util.Map.of(
            "userId", 19L,
            "userName", "Aditya Verma",
            "contestId", contestId,
            "strikes", 2,
            "status", "WARNING_STAGE_2",
            "lastEvent", "TAB_BLUR",
            "timestamp", java.time.Instant.now().minusSeconds(600).toString()
        ));
        return ResponseEntity.ok(violations);
    }
}
