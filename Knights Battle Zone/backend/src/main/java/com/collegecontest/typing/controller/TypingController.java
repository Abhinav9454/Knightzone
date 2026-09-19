package com.collegecontest.typing.controller;

import com.collegecontest.typing.dto.*;
import com.collegecontest.typing.service.TypingTestService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/typing")
public class TypingController {
    private final TypingTestService typingTestService;

    public TypingController(TypingTestService typingTestService) {
        this.typingTestService = typingTestService;
    }

    @GetMapping("/texts")
    public List<TypingTextDTO> getTexts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return typingTestService.getTexts(category, difficulty, page, size);
    }

    @GetMapping("/texts/random")
    public TypingTextDTO getRandomText(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(defaultValue = "false") boolean daily) {
        return typingTestService.getRandomText(category, difficulty, daily);
    }

    @GetMapping("/leaderboard")
    public List<TypingLeaderboardEntryDTO> getLeaderboard(
            @RequestParam(defaultValue = "ALL") String mode,
            @RequestParam(defaultValue = "ALL") String timeRange,
            @RequestParam(defaultValue = "50") int limit) {
        return typingTestService.getLeaderboard(mode, timeRange, limit);
    }

    @GetMapping("/leaderboard/rank/{userId}")
    public Map<String, Integer> getRank(@PathVariable Long userId) {
        return Map.of("rank", typingTestService.getUserRank(userId));
    }

    @GetMapping("/profile")
    public TypingProfileDTO getMyProfile() {
        String email = getCurrentEmail();
        return typingTestService.getProfile(email);
    }

    @GetMapping("/categories")
    public List<String> getCategories() {
        return typingTestService.getCategories();
    }

    @GetMapping("/quotes/categories")
    public List<String> getQuoteCategories() {
        return typingTestService.getCategories();
    }

    @GetMapping("/quotes/random")
    public TypingTextDTO getRandomQuote(@RequestParam(required = false) String category) {
        return typingTestService.getRandomText(category, "Medium", false);
    }

    @GetMapping("/best")
    public TypingProfileDTO getMyBest() {
        String email = getCurrentEmail();
        return typingTestService.getBestProfile(email);
    }

    @PostMapping("/score")
    public TypingScoreResponseDTO submitScore(@RequestBody TypingScoreRequestDTO req) {
        String email = getCurrentEmail();
        return typingTestService.submitScore(email, req);
    }

    @GetMapping("/results/user")
    public List<TypingTestResultDTO> getMyResults(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        String email = getCurrentEmail();
        return typingTestService.getUserResults(email, page, size);
    }

    private String getCurrentEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return authentication.getName();
    }
}
