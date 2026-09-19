package com.collegecontest.voting;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/votes")
public class VotingController {

    private final VotingService votingService;

    public VotingController(VotingService votingService) {
        this.votingService = votingService;
    }

    @PostMapping
    public ResponseEntity<Void> vote(@RequestBody VoteRequest req) {
        votingService.vote(req.getUserId(), req.getTargetType(), req.getTargetId(), req.getValue());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{targetType}/{targetId}")
    public ResponseEntity<Integer> getNet(@PathVariable String targetType, @PathVariable Long targetId) {
        return ResponseEntity.ok(votingService.getNetVotes(targetType, targetId));
    }

    public static class VoteRequest {
        private Long userId;
        private String targetType;
        private Long targetId;
        private int value;

        public Long getUserId() {
            return userId;
        }

        public String getTargetType() {
            return targetType;
        }

        public Long getTargetId() {
            return targetId;
        }

        public int getValue() {
            return value;
        }
    }
}
