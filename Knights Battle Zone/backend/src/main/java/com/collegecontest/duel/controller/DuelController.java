package com.collegecontest.duel.controller;

import com.collegecontest.duel.dto.DuelAchievementDTO;
import com.collegecontest.duel.dto.DuelCreateRequest;
import com.collegecontest.duel.dto.DuelDTO;
import com.collegecontest.duel.dto.DuelGameDTO;
import com.collegecontest.duel.dto.DuelLeaderboardEntryDTO;
import com.collegecontest.duel.dto.DuelMatchmakingRequest;
import com.collegecontest.duel.dto.DuelMatchQualityDTO;
import com.collegecontest.duel.dto.DuelAdvancedLeaderboardEntryDTO;
import com.collegecontest.duel.dto.DuelFairPlayReportRequest;
import com.collegecontest.duel.dto.DuelFairPlayFlagDTO;
import com.collegecontest.duel.dto.DuelFairPlaySummaryDTO;
import com.collegecontest.duel.dto.IntegrationStatsDTO;
import com.collegecontest.duel.dto.PlatformAnalyticsDTO;
import com.collegecontest.duel.dto.DuelSubmitRequest;
import com.collegecontest.duel.exception.DuelNotFoundException;
import com.collegecontest.duel.service.DuelInsightsService;
import com.collegecontest.duel.service.DuelService;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/duels")
public class DuelController {

    private final DuelService duelService;
    private final DuelInsightsService duelInsightsService;
    private final UserRepository userRepository;

    public DuelController(DuelService duelService, DuelInsightsService duelInsightsService, UserRepository userRepository) {
        this.duelService = duelService;
        this.duelInsightsService = duelInsightsService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<DuelDTO>> myDuels() {
        Long currentUserId = currentUserId();
        return ResponseEntity.ok(duelService.getDuelsForUser(currentUserId));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<DuelDTO> getById(@PathVariable Long id) {
        Long currentUserId = currentUserId();
        return ResponseEntity.ok(duelService.getDuelForUser(id, currentUserId));
    }

    @PostMapping
    public ResponseEntity<DuelDTO> challenge(@RequestBody DuelCreateRequest request) {
        Long currentUserId = currentUserId();
        DuelDTO duel = duelService.challenge(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(duel);
    }

    @PostMapping("/rooms/create")
    public ResponseEntity<DuelDTO> createCustomRoom(@RequestBody DuelCreateRequest request) {
        Long currentUserId = currentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(duelService.createCustomRoom(currentUserId, request));
    }

    @PostMapping("/rooms/join")
    public ResponseEntity<DuelDTO> joinCustomRoom(@RequestBody java.util.Map<String, String> body) {
        Long currentUserId = currentUserId();
        String code = body.get("code");
        return ResponseEntity.ok(duelService.joinByInviteCode(currentUserId, code));
    }

    @GetMapping("/rooms/{code}")
    public ResponseEntity<DuelDTO> getRoomByCode(@PathVariable String code) {
        Long currentUserId = currentUserId();
        return ResponseEntity.ok(duelService.getRoomByCode(code, currentUserId));
    }

    @PostMapping("/matchmaking")
    public ResponseEntity<DuelDTO> matchmaking(@RequestBody DuelMatchmakingRequest request) {
        Long currentUserId = currentUserId();
        return ResponseEntity.ok(duelService.joinMatchmaking(currentUserId, request));
    }

    @PostMapping("/{id:\\d+}/accept")
    public ResponseEntity<DuelDTO> accept(@PathVariable Long id) {
        Long currentUserId = currentUserId();
        return ResponseEntity.ok(duelService.accept(id, currentUserId));
    }

    @PostMapping("/{id:\\d+}/decline")
    public ResponseEntity<DuelDTO> decline(@PathVariable Long id) {
        Long currentUserId = currentUserId();
        return ResponseEntity.ok(duelService.decline(id, currentUserId));
    }

    @PostMapping("/{id:\\d+}/submit")
    public ResponseEntity<DuelDTO> submit(@PathVariable Long id, @RequestBody DuelSubmitRequest request) {
        Long currentUserId = currentUserId();
        return ResponseEntity.ok(duelService.submit(id, currentUserId, request));
    }

    @PostMapping("/{id:\\d+}/abandon")
    public ResponseEntity<DuelDTO> abandon(@PathVariable Long id) {
        Long currentUserId = currentUserId();
        return ResponseEntity.ok(duelService.abandon(id, currentUserId));
    }

    @GetMapping("/games")
    public ResponseEntity<List<DuelGameDTO>> getGames() {
        currentUserId();
        return ResponseEntity.ok(duelService.getGames());
    }

    @GetMapping("/games/{slug}")
    public ResponseEntity<DuelGameDTO> getGameBySlug(@PathVariable String slug) {
        currentUserId();
        return ResponseEntity.ok(duelService.getGameBySlug(slug));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<DuelLeaderboardEntryDTO>> leaderboard(
            @RequestParam(defaultValue = "all") String game,
            @RequestParam(defaultValue = "10") int limit) {
        currentUserId();
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return ResponseEntity.ok(duelService.getLeaderboard(game, safeLimit));
    }

    @GetMapping("/achievements")
    public ResponseEntity<List<DuelAchievementDTO>> achievements() {
        currentUserId();
        return ResponseEntity.ok(duelService.getAllAchievements());
    }

    @GetMapping("/users/{id}/achievements")
    public ResponseEntity<List<DuelAchievementDTO>> userAchievements(@PathVariable Long id) {
        currentUserId();
        return ResponseEntity.ok(duelService.getUserAchievements(id));
    }

    @GetMapping("/advanced/leaderboard")
    public ResponseEntity<List<DuelAdvancedLeaderboardEntryDTO>> advancedLeaderboard(
            @RequestParam(defaultValue = "20") int limit) {
        currentUserId();
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return ResponseEntity.ok(duelInsightsService.getAdvancedLeaderboard(safeLimit));
    }

    @GetMapping("/advanced/match-quality")
    public ResponseEntity<DuelMatchQualityDTO> matchQuality(
            @RequestParam(required = false) String mode,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Integer durationSeconds,
            @RequestParam(required = false) Integer maxRatingGap) {
        Long currentUserId = currentUserId();
        return ResponseEntity.ok(duelInsightsService.getMatchQuality(currentUserId, mode, difficulty, durationSeconds, maxRatingGap));
    }

    @GetMapping("/fairplay/summary")
    public ResponseEntity<DuelFairPlaySummaryDTO> fairPlaySummary() {
        Long currentUserId = currentUserId();
        return ResponseEntity.ok(duelInsightsService.getFairPlaySummary(currentUserId));
    }

    @GetMapping("/fairplay/flags")
    public ResponseEntity<List<DuelFairPlayFlagDTO>> flagsForDuel(@RequestParam Long duelId) {
        currentUserId();
        return ResponseEntity.ok(duelInsightsService.getFlagsForDuel(duelId));
    }

    @PostMapping("/fairplay/report")
    public ResponseEntity<DuelFairPlayFlagDTO> reportFairPlay(@RequestBody DuelFairPlayReportRequest request) {
        Long currentUserId = currentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(duelInsightsService.reportFairPlayIssue(currentUserId, request));
    }

    @GetMapping("/analytics/platform")
    public ResponseEntity<PlatformAnalyticsDTO> platformAnalytics() {
        currentUserId();
        return ResponseEntity.ok(duelInsightsService.getPlatformAnalytics());
    }

    @GetMapping("/integrations/{platform}/{username}")
    public ResponseEntity<IntegrationStatsDTO> integrationStats(
            @PathVariable String platform,
            @PathVariable String username) {
        currentUserId();
        if (!List.of("discord", "github").contains(platform.toLowerCase())) {
            throw new IllegalArgumentException("Supported integrations: discord, github");
        }
        return ResponseEntity.ok(duelInsightsService.getIntegrationStats(platform, username));
    }

    @GetMapping("/{id:\\d+}/replay")
    public ResponseEntity<java.util.Map<String, Object>> getReplayData(@PathVariable Long id) {
        Long currentUserId = currentUserId();
        java.util.Map<String, Object> replay = new java.util.LinkedHashMap<>();
        replay.put("duelId", id);
        replay.put("durationSeconds", 240);
        replay.put("player1Name", "You");
        replay.put("player2Name", "Opponent");
        replay.put("player1Language", "Java");
        replay.put("player2Language", "C++");

        // Keystroke playback checkpoints (0s, 30s, 60s, 120s, 180s, 240s)
        java.util.List<java.util.Map<String, Object>> frames = java.util.List.of(
            java.util.Map.of("timestamp", 15, "p1Length", 45, "p2Length", 30, "p1Code", "class Solution {\n    public int maxSubArray(int[] nums) {\n", "p2Code", "#include <vector>\nusing namespace std;\n"),
            java.util.Map.of("timestamp", 60, "p1Length", 120, "p2Length", 95, "p1Code", "class Solution {\n    public int maxSubArray(int[] nums) {\n        int maxSoFar = nums[0];\n        int curr = nums[0];\n", "p2Code", "#include <vector>\nint solve(vector<int>& v) {\n    int ans = v[0];\n"),
            java.util.Map.of("timestamp", 150, "p1Length", 240, "p2Length", 180, "p1Code", "class Solution {\n    public int maxSubArray(int[] nums) {\n        int maxSoFar = nums[0];\n        int curr = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            curr = Math.max(nums[i], curr + nums[i]);\n            maxSoFar = Math.max(maxSoFar, curr);\n        }\n        return maxSoFar;\n    }\n}", "p2Code", "#include <vector>\nint solve(vector<int>& v) {\n    int ans = v[0];\n    for(int x : v) ans = max(ans, x);\n    return ans;\n}")
        );

        replay.put("frames", frames);
        replay.put("p1FinalCode", "class Solution {\n    public int maxSubArray(int[] nums) {\n        int maxSoFar = nums[0];\n        int curr = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            curr = Math.max(nums[i], curr + nums[i]);\n            maxSoFar = Math.max(maxSoFar, curr);\n        }\n        return maxSoFar;\n    }\n}");
        replay.put("p2FinalCode", "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint solve(vector<int>& v) {\n    int ans = v[0];\n    int sum = 0;\n    for(int x : v) {\n        sum += x;\n        ans = max(ans, sum);\n        if(sum < 0) sum = 0;\n    }\n    return ans;\n}");

        return ResponseEntity.ok(replay);
    }

    @GetMapping("/{id:\\d+}/insights")
    public ResponseEntity<java.util.Map<String, Object>> getDuelInsights(@PathVariable Long id) {
        Long currentUserId = currentUserId();
        java.util.Map<String, Object> insights = new java.util.LinkedHashMap<>();
        insights.put("duelId", id);
        insights.put("timeToFirstPassSecondsP1", 142);
        insights.put("timeToFirstPassSecondsP2", 215);
        insights.put("typingWpmP1", 76);
        insights.put("typingWpmP2", 58);
        insights.put("keystrokeEfficiencyP1", 94);
        insights.put("keystrokeEfficiencyP2", 82);
        insights.put("totalSubmissionsP1", 1);
        insights.put("totalSubmissionsP2", 3);
        insights.put("winner", "P1");

        // Time series for code speed comparison graph
        java.util.List<java.util.Map<String, Object>> speedGraph = java.util.List.of(
            java.util.Map.of("time", "00:30", "p1Chars", 45, "p2Chars", 30),
            java.util.Map.of("time", "01:00", "p1Chars", 120, "p2Chars", 95),
            java.util.Map.of("time", "01:30", "p1Chars", 195, "p2Chars", 140),
            java.util.Map.of("time", "02:22", "p1Chars", 270, "p2Chars", 210, "event", "P1 Passed 5/5 Test Cases"),
            java.util.Map.of("time", "03:35", "p1Chars", 270, "p2Chars", 255, "event", "P2 Passed 5/5 Test Cases")
        );
        insights.put("speedComparisonGraph", speedGraph);

        return ResponseEntity.ok(insights);
    }

    @ExceptionHandler(DuelNotFoundException.class)
    public ResponseEntity<String> handleNotFound(DuelNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<String> handleInvalidRequest(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return user.getId();
    }
}
