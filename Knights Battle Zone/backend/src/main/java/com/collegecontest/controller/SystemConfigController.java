package com.collegecontest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/admin/config")
public class SystemConfigController {

    private static final Map<String, Object> CONFIG = new ConcurrentHashMap<>();

    static {
        CONFIG.put("maintenanceMode", false);
        CONFIG.put("registrationOpen", true);
        CONFIG.put("aiHintsEnabled", true);
        CONFIG.put("sandboxCpuLimitPercent", 80);
        CONFIG.put("sandboxMemoryLimitMb", 512);
        CONFIG.put("sandboxTimeoutSeconds", 5);
        CONFIG.put("strictProctoringStrikes", 3);
        CONFIG.put("announcementBanner", "Welcome to Knightzone Arena 2026! National Coding Battles are now active.");
        CONFIG.put("lastModifiedBy", "admin@knightzone.dev");
        CONFIG.put("lastUpdatedAt", Instant.now().toString());
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getConfig() {
        return ResponseEntity.ok(new LinkedHashMap<>(CONFIG));
    }

    @PostMapping({"/maintenance", "/maintenance-mode"})
    public ResponseEntity<Map<String, Object>> updateConfig(@RequestBody Map<String, Object> updates) {
        if (updates.containsKey("maintenanceMode")) {
            CONFIG.put("maintenanceMode", Boolean.valueOf(String.valueOf(updates.get("maintenanceMode"))));
        }
        if (updates.containsKey("registrationOpen")) {
            CONFIG.put("registrationOpen", Boolean.valueOf(String.valueOf(updates.get("registrationOpen"))));
        }
        if (updates.containsKey("aiHintsEnabled")) {
            CONFIG.put("aiHintsEnabled", Boolean.valueOf(String.valueOf(updates.get("aiHintsEnabled"))));
        }
        if (updates.containsKey("sandboxMemoryLimitMb")) {
            CONFIG.put("sandboxMemoryLimitMb", Integer.valueOf(String.valueOf(updates.get("sandboxMemoryLimitMb"))));
        }
        if (updates.containsKey("sandboxTimeoutSeconds")) {
            CONFIG.put("sandboxTimeoutSeconds", Integer.valueOf(String.valueOf(updates.get("sandboxTimeoutSeconds"))));
        }
        if (updates.containsKey("announcementBanner")) {
            CONFIG.put("announcementBanner", String.valueOf(updates.get("announcementBanner")));
        }

        CONFIG.put("lastModifiedBy", "admin@knightzone.dev");
        CONFIG.put("lastUpdatedAt", Instant.now().toString());

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("status", "success");
        resp.put("message", "System configuration and feature toggles updated successfully.");
        resp.put("config", CONFIG);

        return ResponseEntity.ok(resp);
    }
}
