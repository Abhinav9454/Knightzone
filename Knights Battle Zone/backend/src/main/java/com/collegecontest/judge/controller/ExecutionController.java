package com.collegecontest.judge.controller;

import com.collegecontest.judge.dto.SubmissionRequest;
import com.collegecontest.judge.dto.SubmissionResult;
import com.collegecontest.judge.service.DockerExecutionService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class ExecutionController {

    private final ObjectProvider<DockerExecutionService> dockerExecutionServiceProvider;

    public ExecutionController(ObjectProvider<DockerExecutionService> dockerExecutionServiceProvider) {
        this.dockerExecutionServiceProvider = dockerExecutionServiceProvider;
    }

    @PostMapping({"/execute", "/judge/run-custom"})
    public ResponseEntity<Map<String, Object>> execute(@RequestBody Map<String, Object> payload) {
        DockerExecutionService dockerExecutionService = dockerExecutionServiceProvider.getIfAvailable();
        if (dockerExecutionService == null) {
            return ResponseEntity.status(503).body(Map.of(
                    "status", "error",
                    "output", "",
                    "error", "Embedded judge is disabled"
            ));
        }

        SubmissionRequest request = new SubmissionRequest();
        request.setLanguage(stringValue(payload.get("language"), "java"));
        request.setCode(stringValue(payload.get("code"), ""));
        request.setStdin(stringValue(payload.get("input"), ""));
        request.setTimeLimitSeconds(intValue(payload.get("timeLimitSeconds"), 5));
        request.setMemoryMb(intValue(payload.get("memoryMb"), 256));
        request.setCpus(doubleValue(payload.get("cpus"), 0.5));

        try {
            SubmissionResult result = dockerExecutionService.execute(request);
            return ResponseEntity.ok(toLegacyResponse(result));
        } catch (Exception ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("output", "");
            error.put("error", "Execution failed: " + ex.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    private Map<String, Object> toLegacyResponse(SubmissionResult result) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("status", normalizeStatus(result.getStatus()));
        payload.put("output", safe(result.getStdout()));
        payload.put("executionTime", toMillis(result.getRuntimeSeconds()));

        String stderr = safe(result.getStderr());
        if (!stderr.isBlank()) {
            payload.put("error", stderr);
        } else if (!"success".equals(payload.get("status"))) {
            payload.put("error", result.getStatus());
        } else {
            payload.put("error", null);
        }
        return payload;
    }

    private String normalizeStatus(String status) {
        if (status == null) {
            return "error";
        }
        String normalized = status.trim().toUpperCase();
        return switch (normalized) {
            case "ACCEPTED", "SUCCESS" -> "success";
            case "TIME_LIMIT", "TIMEOUT" -> "timeout";
            case "COMPILE_ERROR" -> "compile_error";
            case "RUNTIME_ERROR", "FAILED", "ERROR" -> "runtime_error";
            default -> "error";
        };
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private int toMillis(Double runtimeSeconds) {
        if (runtimeSeconds == null) {
            return 0;
        }
        return (int) Math.max(0, Math.round(runtimeSeconds * 1000.0));
    }

    private String stringValue(Object value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String normalized = value.toString().trim();
        return normalized.isEmpty() ? fallback : normalized;
    }

    private int intValue(Object value, int fallback) {
        if (value == null) {
            return fallback;
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private double doubleValue(Object value, double fallback) {
        if (value == null) {
            return fallback;
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }
}
