package com.collegecontest.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/audit-logs")
public class AuditLogController {

    private static final List<Map<String, Object>> LOGS = new ArrayList<>();

    static {
        LOGS.add(Map.of(
            "id", "LOG-9821",
            "timestamp", Instant.now().minusSeconds(300).toString(),
            "actorEmail", "admin@knightzone.dev",
            "action", "MAINTENANCE_TOGGLE",
            "resource", "GLOBAL_SYSTEM_CONFIG",
            "ipAddress", "192.168.1.105",
            "status", "SUCCESS",
            "details", "Maintenance mode checked and sandbox CPU limits verified"
        ));
        LOGS.add(Map.of(
            "id", "LOG-9820",
            "timestamp", Instant.now().minusSeconds(1200).toString(),
            "actorEmail", "admin@knightzone.dev",
            "action", "CONTEST_PUBLISH",
            "resource", "Contest #104 (Mega Knight Hackathon)",
            "ipAddress", "192.168.1.105",
            "status", "SUCCESS",
            "details", "Contest schedules updated, anti-cheat 3-strike rules enabled"
        ));
        LOGS.add(Map.of(
            "id", "LOG-9819",
            "timestamp", Instant.now().minusSeconds(3600).toString(),
            "actorEmail", "faculty@nit.edu",
            "action", "PLAGIARISM_SCAN",
            "resource", "Contest #101",
            "ipAddress", "14.139.128.45",
            "status", "SUCCESS",
            "details", "AST tokenization similarity scan flagged 2 pairs (>85% match)"
        ));
        LOGS.add(Map.of(
            "id", "LOG-9818",
            "timestamp", Instant.now().minusSeconds(7200).toString(),
            "actorEmail", "system-sandbox@knightzone.dev",
            "action", "SANDBOX_LIMIT_ENFORCE",
            "resource", "Docker Judge Worker #3",
            "ipAddress", "10.0.0.12",
            "status", "WARNING",
            "details", "Memory threshold exceeded 256MB in custom runner sandbox"
        ));
        LOGS.add(Map.of(
            "id", "LOG-9817",
            "timestamp", Instant.now().minusSeconds(14400).toString(),
            "actorEmail", "admin@knightzone.dev",
            "action", "ROLE_ASSIGN",
            "resource", "User ID #42 (faculty@nit.edu)",
            "ipAddress", "192.168.1.105",
            "status", "SUCCESS",
            "details", "Granted ROLE_FACULTY with contest authoring privileges"
        ));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String action) {
        List<Map<String, Object>> filtered = new ArrayList<>();
        for (Map<String, Object> log : LOGS) {
            boolean matchesSearch = search == null || search.isBlank()
                    || String.valueOf(log.get("actorEmail")).toLowerCase().contains(search.toLowerCase())
                    || String.valueOf(log.get("details")).toLowerCase().contains(search.toLowerCase())
                    || String.valueOf(log.get("resource")).toLowerCase().contains(search.toLowerCase());
            boolean matchesAction = action == null || action.isBlank() || "ALL".equalsIgnoreCase(action)
                    || String.valueOf(log.get("action")).equalsIgnoreCase(action);

            if (matchesSearch && matchesAction) {
                filtered.add(log);
            }
        }
        return ResponseEntity.ok(filtered);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportLogsCsv() {
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Timestamp,Actor,Action,Resource,IP_Address,Status,Details\n");
        for (Map<String, Object> log : LOGS) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                log.get("id"),
                log.get("timestamp"),
                log.get("actorEmail"),
                log.get("action"),
                log.get("resource"),
                log.get("ipAddress"),
                log.get("status"),
                log.get("details")
            ));
        }

        byte[] bytes = csv.toString().getBytes();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"knightzone-audit-trail.csv\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(bytes);
    }
}
