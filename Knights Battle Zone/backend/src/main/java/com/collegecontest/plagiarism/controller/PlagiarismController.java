package com.collegecontest.plagiarism.controller;

import com.collegecontest.model.Submission;
import com.collegecontest.plagiarism.model.PlagiarismFlag;
import com.collegecontest.plagiarism.repository.PlagiarismFlagRepository;
import com.collegecontest.plagiarism.service.SimilarityCheckerService;
import com.collegecontest.repository.SubmissionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping({"/admin/plagiarism", "/plagiarism"})
public class PlagiarismController {

    private final SimilarityCheckerService similarityCheckerService;
    private final PlagiarismFlagRepository flagRepository;
    private final SubmissionRepository submissionRepository;

    public PlagiarismController(SimilarityCheckerService similarityCheckerService,
                                PlagiarismFlagRepository flagRepository,
                                SubmissionRepository submissionRepository) {
        this.similarityCheckerService = similarityCheckerService;
        this.flagRepository = flagRepository;
        this.submissionRepository = submissionRepository;
    }

    @PostMapping({"/check/{contestId}"})
    public ResponseEntity<Map<String, Object>> scanContest(@PathVariable Long contestId) {
        similarityCheckerService.checkContestForPlagiarism(contestId);
        List<PlagiarismFlag> flags = similarityCheckerService.getFlagsByContest(contestId);
        Map<String, Object> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", "Plagiarism check completed for contest #" + contestId);
        res.put("flagsCount", flags.size());
        res.put("flags", flags);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/check")
    public ResponseEntity<Map<String, Object>> scanContestFromBody(
            @RequestBody(required = false) Map<String, Object> body,
            @RequestParam(required = false) Long contestId) {
        Long targetId = contestId;
        if (targetId == null && body != null && body.get("contestId") != null) {
            try {
                targetId = Long.valueOf(String.valueOf(body.get("contestId")));
            } catch (Exception ignored) {}
        }
        if (targetId == null) {
            targetId = 101L;
        }
        return scanContest(targetId);
    }

    @GetMapping("/flags")
    public ResponseEntity<List<PlagiarismFlag>> getPendingFlags() {
        return ResponseEntity.ok(similarityCheckerService.getPendingFlags());
    }

    @GetMapping("/contest/{contestId}")
    public ResponseEntity<List<PlagiarismFlag>> getContestFlags(@PathVariable Long contestId) {
        return ResponseEntity.ok(similarityCheckerService.getFlagsByContest(contestId));
    }

    @PostMapping("/resolve/{flagId}")
    public ResponseEntity<Map<String, String>> resolveFlag(
            @PathVariable Long flagId,
            @RequestBody(required = false) Map<String, String> body) {
        String resolution = body != null ? body.getOrDefault("resolution", "RESOLVED") : "RESOLVED";
        similarityCheckerService.resolveFlag(flagId, resolution);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Flag resolved successfully"));
    }

    @GetMapping("/comparison/{flagId}")
    public ResponseEntity<Map<String, Object>> getFlagComparison(@PathVariable Long flagId) {
        Optional<PlagiarismFlag> flagOpt = flagRepository.findById(flagId);
        if (flagOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        PlagiarismFlag flag = flagOpt.get();
        Optional<Submission> sub1Opt = submissionRepository.findById(flag.getSubmissionId1());
        Optional<Submission> sub2Opt = submissionRepository.findById(flag.getSubmissionId2());

        Map<String, Object> comparison = new HashMap<>();
        comparison.put("flagId", flag.getId());
        comparison.put("similarityScore", flag.getSimilarityScore());
        comparison.put("status", flag.getStatus().name());
        comparison.put("createdAt", flag.getCreatedAt());

        if (sub1Opt.isPresent()) {
            Submission s1 = sub1Opt.get();
            Map<String, Object> s1Data = new HashMap<>();
            s1Data.put("id", s1.getId());
            s1Data.put("code", s1.getCode());
            s1Data.put("language", s1.getLanguage());
            s1Data.put("userName", s1.getUser() != null ? s1.getUser().getName() : "Candidate #1");
            s1Data.put("userEmail", s1.getUser() != null ? s1.getUser().getEmail() : "");
            s1Data.put("submittedAt", s1.getSubmittedAt());
            comparison.put("submission1", s1Data);
        }

        if (sub2Opt.isPresent()) {
            Submission s2 = sub2Opt.get();
            Map<String, Object> s2Data = new HashMap<>();
            s2Data.put("id", s2.getId());
            s2Data.put("code", s2.getCode());
            s2Data.put("language", s2.getLanguage());
            s2Data.put("userName", s2.getUser() != null ? s2.getUser().getName() : "Candidate #2");
            s2Data.put("userEmail", s2.getUser() != null ? s2.getUser().getEmail() : "");
            s2Data.put("submittedAt", s2.getSubmittedAt());
            comparison.put("submission2", s2Data);
        }

        return ResponseEntity.ok(comparison);
    }
}
