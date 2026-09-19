package com.collegecontest.tabswitch.controller;

import com.collegecontest.tabswitch.service.TabSwitchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/contests")
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
}
