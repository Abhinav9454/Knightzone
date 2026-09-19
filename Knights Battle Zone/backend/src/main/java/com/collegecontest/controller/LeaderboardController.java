package com.collegecontest.controller;

import com.collegecontest.dto.ContestFirstSolverDTO;
import com.collegecontest.dto.LeaderboardFilterParams;
import com.collegecontest.dto.LeaderboardEntry;
import com.collegecontest.dto.LeaderboardPageResponse;
import com.collegecontest.dto.LeaderboardTimeRange;
import com.collegecontest.service.LeaderboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/leaderboard")
@Tag(name = "Leaderboard", description = "Leaderboard APIs")
public class LeaderboardController {

    @Autowired
    private LeaderboardService leaderboardService;

    @GetMapping
    @Operation(summary = "Get global leaderboard with advanced filters", responses = {
            @ApiResponse(responseCode = "200", description = "Filtered leaderboard returned") })
    public LeaderboardPageResponse getGlobalLeaderboard(
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String college,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String mode,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false, defaultValue = "all-time") String timeRange,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer size) {

        LeaderboardFilterParams filters = LeaderboardFilterParams.builder()
                .region(region)
                .country(country)
                .college(college)
                .department(department)
                .mode(mode)
                .difficulty(difficulty)
                .timeRange(LeaderboardTimeRange.fromQuery(timeRange))
                .build();

        return leaderboardService.getGlobalLeaderboard(filters, page == null ? 0 : page, size == null ? 20 : size);
    }

    @GetMapping("/global")
    @Operation(summary = "Get global leaderboard (legacy endpoint)", responses = {
            @ApiResponse(responseCode = "200", description = "Global leaderboard returned") })
    public LeaderboardPageResponse getGlobalLeaderboardLegacy(
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String college,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String mode,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false, defaultValue = "all-time") String timeRange,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer size) {
        return getGlobalLeaderboard(region, country, college, department, mode, difficulty, timeRange, page, size);
    }

    @GetMapping("/{contestId}")
    @Operation(summary = "Get contest leaderboard", responses = {
            @ApiResponse(responseCode = "200", description = "Leaderboard returned") })
    public List<LeaderboardEntry> getContestLeaderboard(@PathVariable Long contestId) {
        return leaderboardService.getContestLeaderboard(contestId);
    }

    @GetMapping("/{contestId}/first-solvers")
    @Operation(summary = "Get first solver per problem for a contest", responses = {
            @ApiResponse(responseCode = "200", description = "First-solver board returned") })
    public List<ContestFirstSolverDTO> getContestFirstSolvers(@PathVariable Long contestId) {
        return leaderboardService.getContestProblemFirstSolvers(contestId);
    }
}
