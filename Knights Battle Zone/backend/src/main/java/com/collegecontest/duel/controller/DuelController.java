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
