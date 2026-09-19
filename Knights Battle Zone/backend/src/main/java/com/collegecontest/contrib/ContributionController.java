package com.collegecontest.contrib;

import com.collegecontest.contrib.dto.ContributionHistoryDTO;
import com.collegecontest.contrib.dto.ContributionSummaryDTO;
import com.collegecontest.contrib.dto.ContributionTypeInfoDTO;
import com.collegecontest.contrib.dto.ContributorDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contributions")
public class ContributionController {

    private final ContributionService contributionService;

    public ContributionController(ContributionService contributionService) {
        this.contributionService = contributionService;
    }

    @PostMapping
    public ResponseEntity<Void> add(@RequestBody ContributionRequest req) {
        contributionService.addContribution(req.getUserId(), req.getType(), req.getReferenceId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<ContributorDTO>> leaderboard(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(contributionService.getLeaderboard(limit));
    }

    @GetMapping("/types")
    public ResponseEntity<List<ContributionTypeInfoDTO>> contributionTypes() {
        return ResponseEntity.ok(contributionService.getContributionTypes());
    }

    @GetMapping("/users/{userId}/index")
    public ResponseEntity<Integer> index(@PathVariable Long userId) {
        return ResponseEntity.ok(contributionService.getContributionIndex(userId));
    }

    @GetMapping("/users/{userId}/summary")
    public ResponseEntity<ContributionSummaryDTO> summary(@PathVariable Long userId) {
        return ResponseEntity.ok(contributionService.getUserSummary(userId));
    }

    @GetMapping("/users/{userId}/history")
    public ResponseEntity<List<ContributionHistoryDTO>> history(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "40") int limit) {
        return ResponseEntity.ok(contributionService.getUserHistory(userId, limit));
    }

    public static class ContributionRequest {
        private Long userId;
        private String type;
        private Long referenceId;

        public Long getUserId() {
            return userId;
        }

        public String getType() {
            return type;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Long getReferenceId() {
            return referenceId;
        }

        public void setReferenceId(Long referenceId) {
            this.referenceId = referenceId;
        }
    }
}
