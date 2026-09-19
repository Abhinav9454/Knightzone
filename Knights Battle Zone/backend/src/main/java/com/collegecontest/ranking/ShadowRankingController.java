package com.collegecontest.ranking;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contests/{contestId}/shadow-rankings")
public class ShadowRankingController {

    private final ShadowRankService shadowRankService;

    public ShadowRankingController(ShadowRankService shadowRankService) {
        this.shadowRankService = shadowRankService;
    }

    @GetMapping
    public ResponseEntity<List<ShadowRankingDTO>> getLeaderboard(@PathVariable Long contestId) {
        return ResponseEntity.ok(shadowRankService.getShadowLeaderboard(contestId));
    }

    @GetMapping("/users/{userId}/shadow-rank")
    public ResponseEntity<ShadowRankingDTO> getUserRank(@PathVariable Long contestId, @PathVariable Long userId) {
        ShadowRankingDTO dto = shadowRankService.getShadowRank(contestId, userId);
        if (dto == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/compute")
    public ResponseEntity<Void> compute(@PathVariable Long contestId) {
        shadowRankService.computeShadowRanking(contestId);
        return ResponseEntity.accepted().build();
    }
}
