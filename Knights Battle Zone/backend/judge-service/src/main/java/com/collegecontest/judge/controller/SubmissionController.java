package com.collegecontest.judge.controller;

import com.collegecontest.judge.dto.SubmissionRequest;
import com.collegecontest.judge.model.Submission;
import com.collegecontest.judge.mq.SubmissionProducer;
import com.collegecontest.judge.repo.SubmissionRepository;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/judge")
public class SubmissionController {

    private final SubmissionRepository repo;
    private final SubmissionProducer producer;

    public SubmissionController(SubmissionRepository repo, SubmissionProducer producer) {
        this.repo = repo;
        this.producer = producer;
    }

    // Accept submission, persist as PENDING, enqueue and return id immediately
    @PostMapping(path = "/submit", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> submit(
            @RequestBody SubmissionRequest req,
            @RequestParam(name = "lane", required = false) String lane) {
        String id = UUID.randomUUID().toString();
        Submission s = new Submission();
        s.setId(id);
        s.setLanguage(req.getLanguage());
        try {
            s.setProblemId(req.getProblemId() == null ? null : Long.parseLong(req.getProblemId()));
        } catch (NumberFormatException ignored) {
            s.setProblemId(null);
        }
        s.setCode(req.getCode());
        s.setTimeLimitSeconds(normalizePositiveInt(req.getTimeLimitSeconds(), 5));
        s.setMemoryMb(normalizePositiveInt(req.getMemoryMb(), 256));
        s.setCpus(normalizePositiveDouble(req.getCpus(), 0.5));
        s.setStatus("PENDING");
        s.setCreatedAt(Instant.now());
        s.setUpdatedAt(Instant.now());
        repo.save(s);

        // enqueue for async processing
        String queueLane = normalizeLane(lane != null && !lane.isBlank() ? lane : req.getQueueLane());
        producer.sendSubmission(id, queueLane);

        return ResponseEntity.accepted().body(Map.of("submissionId", id, "lane", queueLane));
    }

    @GetMapping(path = "/status/{id}")
    public ResponseEntity<Submission> getStatus(@PathVariable String id) {
        return repo.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    private String normalizeLane(String lane) {
        if (lane == null || lane.isBlank()) {
            return "submit";
        }
        String normalized = lane.trim().toLowerCase();
        return switch (normalized) {
            case "run" -> "run";
            case "high", "priority", "high-priority" -> "high";
            default -> "submit";
        };
    }

    private int normalizePositiveInt(int value, int fallback) {
        return value > 0 ? value : fallback;
    }

    private double normalizePositiveDouble(double value, double fallback) {
        return value > 0 ? value : fallback;
    }
}
