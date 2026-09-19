package com.collegecontest.tracker.controller;

import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import com.collegecontest.tracker.dto.*;
import com.collegecontest.tracker.model.TrackerPlatform;
import com.collegecontest.tracker.service.TrackerConnectionService;
import com.collegecontest.tracker.service.TrackerInsightService;
import com.collegecontest.tracker.service.TrackerReportService;
import com.collegecontest.tracker.service.TrackerSkillGapService;
import com.collegecontest.tracker.service.TrackerSummaryService;
import com.collegecontest.tracker.service.TrackerSyncService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/tracker")
@PreAuthorize("isAuthenticated()")
public class TrackerController {
    private final UserRepository userRepository;
    private final TrackerConnectionService trackerConnectionService;
    private final TrackerSyncService trackerSyncService;
    private final TrackerSummaryService trackerSummaryService;
    private final TrackerInsightService trackerInsightService;
    private final TrackerSkillGapService trackerSkillGapService;
    private final TrackerReportService trackerReportService;

    public TrackerController(
            UserRepository userRepository,
            TrackerConnectionService trackerConnectionService,
            TrackerSyncService trackerSyncService,
            TrackerSummaryService trackerSummaryService,
            TrackerInsightService trackerInsightService,
            TrackerSkillGapService trackerSkillGapService,
            TrackerReportService trackerReportService) {
        this.userRepository = userRepository;
        this.trackerConnectionService = trackerConnectionService;
        this.trackerSyncService = trackerSyncService;
        this.trackerSummaryService = trackerSummaryService;
        this.trackerInsightService = trackerInsightService;
        this.trackerSkillGapService = trackerSkillGapService;
        this.trackerReportService = trackerReportService;
    }

    @PostMapping("/platforms/connect")
    @ResponseStatus(HttpStatus.CREATED)
    public PlatformConnectionDTO connectPlatform(@Valid @RequestBody ConnectPlatformRequest request) {
        return trackerConnectionService.upsertConnection(currentUser().getId(), request);
    }

    @GetMapping("/platforms")
    public List<PlatformConnectionDTO> getConnections() {
        return trackerConnectionService.getConnections(currentUser().getId());
    }

    @PostMapping("/platforms/{platform}/sync")
    public PlatformSyncResponse syncPlatform(@PathVariable String platform) {
        TrackerPlatform trackerPlatform = parsePlatform(platform);
        return trackerSyncService.syncForUserAndPlatform(currentUser().getId(), trackerPlatform);
    }

    @PostMapping("/sync-all")
    public List<PlatformSyncResponse> syncAll() {
        return trackerSyncService.syncAllForUser(currentUser().getId());
    }

    @GetMapping("/summary")
    public TrackerSummaryResponse getSummary() {
        return trackerSummaryService.getSummary(currentUser().getId());
    }

    @GetMapping("/insights/weekly")
    public TrackerInsightResponse getWeeklyInsight(@RequestParam(defaultValue = "false") boolean useAi) {
        return trackerInsightService.weeklyInsight(currentUser().getId(), useAi);
    }

    @GetMapping("/insights/skill-gap")
    public TrackerSkillGapResponse getSkillGap(
            @RequestParam(defaultValue = "SDE") String targetRole,
            @RequestParam(defaultValue = "false") boolean useAi) {
        return trackerSkillGapService.getSkillGap(currentUser().getId(), targetRole, useAi);
    }

    @GetMapping("/report")
    public TrackerPerformanceReportResponse getReport(
            @RequestParam(defaultValue = "SDE") String targetRole,
            @RequestParam(defaultValue = "false") boolean useAi) {
        return trackerReportService.generateReport(currentUser().getId(), targetRole, useAi);
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private TrackerPlatform parsePlatform(String platform) {
        try {
            return TrackerPlatform.from(platform);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid platform");
        }
    }
}
