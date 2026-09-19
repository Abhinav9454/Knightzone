package com.collegecontest.marketplace.controller;

import com.collegecontest.marketplace.dto.*;
import com.collegecontest.marketplace.service.PassageMarketplaceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/passages")
public class PassageMarketplaceController {

    private final PassageMarketplaceService marketplaceService;

    public PassageMarketplaceController(PassageMarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @PostMapping
    public ResponseEntity<PassageDTO> createPassage(@Valid @RequestBody CreatePassageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(marketplaceService.createPassage(request, currentEmail()));
    }

    @GetMapping
    public Page<PassageDTO> listPassages(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "new") String sort,
            @RequestParam(defaultValue = "false") Boolean mine,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return marketplaceService.listPassages(search, tag, sort, mine, page, size, currentEmail());
    }

    @GetMapping("/featured")
    public Page<PassageDTO> getFeatured(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return marketplaceService.getFeatured(search, tag, page, size, currentEmail());
    }

    @GetMapping("/trending")
    public Page<PassageDTO> getTrending(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return marketplaceService.getTrending(search, tag, page, size, currentEmail());
    }

    @GetMapping("/{id}")
    public PassageDTO getPassage(@PathVariable Long id) {
        return marketplaceService.getPassage(id, currentEmail());
    }

    @PostMapping("/{id}/rate")
    public RatePassageResponse ratePassage(@PathVariable Long id, @Valid @RequestBody RatePassageRequest request) {
        return marketplaceService.ratePassage(id, request, currentEmail());
    }

    @PostMapping("/{id}/bookmark")
    public BookmarkResponse toggleBookmark(@PathVariable Long id) {
        return marketplaceService.toggleBookmark(id, currentEmail());
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<Void> reportPassage(@PathVariable Long id, @Valid @RequestBody ReportPassageRequest request) {
        marketplaceService.reportPassage(id, request, currentEmail());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/moderation/reports")
    public Page<PassageModerationDTO> getModerationReports(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return marketplaceService.getModerationReports(status, page, size, currentEmail());
    }

    @GetMapping("/moderation/audit")
    public Page<PassageModerationAuditDTO> getModerationAudit(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String reviewerEmail
    ) {
        return marketplaceService.getModerationAudit(page, size, reviewerEmail, currentEmail());
    }

    @PostMapping("/moderation/{moderationId}/review")
    public PassageModerationDTO reviewModeration(
            @PathVariable Long moderationId,
            @Valid @RequestBody ReviewModerationRequest request
    ) {
        return marketplaceService.reviewModeration(moderationId, request, currentEmail());
    }

    private String currentEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : "";
    }
}
