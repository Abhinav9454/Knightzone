package com.collegecontest.hint.controller;

import com.collegecontest.hint.dto.HintDTO;
import com.collegecontest.hint.service.HintService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.NotNull;
import java.util.List;

@RestController
@RequestMapping("/hints")
@Validated
public class HintController {

    private static final Logger log = LoggerFactory.getLogger(HintController.class);

    private final HintService hintService;

    public HintController(HintService hintService) {
        this.hintService = hintService;
    }

    @GetMapping("/problem/{problemId}")
    public ResponseEntity<List<HintDTO>> getHintsForProblem(
            @PathVariable @NotNull Long problemId,
            @RequestParam @NotNull Long userId,
            Authentication authentication) {
        
        log.debug("Getting hints for userId={}, problemId={}", userId, problemId);

        // Authorization check - same user or admin
        if (!isAuthorized(userId, authentication)) {
            log.warn("Unauthorized access attempt for userId={}", userId);
            return ResponseEntity.status(403).build();
        }

        List<HintDTO> hints = hintService.getAvailableHints(userId, problemId);
        log.debug("Found {} hints for userId={}, problemId={}", hints.size(), userId, problemId);
        
        return ResponseEntity.ok(hints);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<HintDTO>> getAllHintsForUser(
            @PathVariable @NotNull Long userId,
            Authentication authentication) {
        
        log.debug("Getting all hints for userId={}", userId);

        // Authorization check - same user or admin
        if (!isAuthorized(userId, authentication)) {
            log.warn("Unauthorized access attempt for userId={}", userId);
            return ResponseEntity.status(403).build();
        }

        List<HintDTO> hints = hintService.getAllHintsForUser(userId);
        return ResponseEntity.ok(hints);
    }

    private boolean isAuthorized(Long userId, Authentication authentication) {
        if (authentication == null) {
            return false;
        }

        // Check if admin
        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN") || role.equals("ROLE_SUPER_ADMIN"));

        if (isAdmin) {
            return true;
        }

        // Check if same user
        String principal = authentication.getPrincipal().toString();
        try {
            Long authenticatedUserId = Long.parseLong(principal);
            return authenticatedUserId.equals(userId);
        } catch (NumberFormatException e) {
            log.error("Failed to parse user ID from principal: {}", principal);
            return false;
        }
    }
}
