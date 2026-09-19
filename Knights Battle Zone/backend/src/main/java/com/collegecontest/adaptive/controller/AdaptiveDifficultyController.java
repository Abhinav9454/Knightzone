package com.collegecontest.adaptive.controller;

import com.collegecontest.adaptive.dto.ProblemDTO;
import com.collegecontest.adaptive.dto.SkillHistoryDTO;
import com.collegecontest.adaptive.exception.ProblemNotFoundException;
import com.collegecontest.adaptive.exception.UserNotFoundException;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import com.collegecontest.service.AdaptiveDifficultyService;
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
@RequestMapping("/adaptive")
@Validated
public class AdaptiveDifficultyController {

    private static final Logger log = LoggerFactory.getLogger(AdaptiveDifficultyController.class);
    private final AdaptiveDifficultyService adaptiveDifficultyService;
    private final UserRepository userRepository;

    public AdaptiveDifficultyController(AdaptiveDifficultyService adaptiveDifficultyService, UserRepository userRepository) {
        this.adaptiveDifficultyService = adaptiveDifficultyService;
        this.userRepository = userRepository;
    }

    @PostMapping("/skill/update")
    public ResponseEntity<Void> updateSkill(
            @RequestParam @NotNull Long userId,
            @RequestParam @NotNull Long problemId,
            @RequestParam Boolean solved,
            Authentication authentication) {
        
        log.debug("Updating skill for userId={}, problemId={}, solved={}", userId, problemId, solved);
        if (!isAuthorized(userId, authentication)) return ResponseEntity.status(403).build();

        try {
            adaptiveDifficultyService.updateSkill(userId, problemId, solved);
            return ResponseEntity.ok().build();
        } catch (UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/problems/recommend")
    public ResponseEntity<ProblemDTO> recommendProblem(
            @RequestParam @NotNull Long userId,
            Authentication authentication) {
        
        log.debug("Getting problem recommendation for userId={}", userId);
        if (!isAuthorized(userId, authentication)) return ResponseEntity.status(403).build();

        try {
            ProblemDTO problem = adaptiveDifficultyService.recommendProblem(userId);
            return problem != null ? ResponseEntity.ok(problem) : ResponseEntity.noContent().build();
        } catch (UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (ProblemNotFoundException e) {
            return ResponseEntity.noContent().build();
        }
    }

    @GetMapping("/skill/{userId}")
    public ResponseEntity<Double> getUserSkill(
            @PathVariable @NotNull Long userId,
            Authentication authentication) {
        
        log.debug("Getting skill level for userId={}", userId);
        if (!isAuthorized(userId, authentication)) return ResponseEntity.status(403).build();

        try {
            return ResponseEntity.ok(adaptiveDifficultyService.getUserSkill(userId));
        } catch (UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/skill/{userId}/history")
    public ResponseEntity<List<SkillHistoryDTO>> getSkillHistory(
            @PathVariable @NotNull Long userId,
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        
        log.debug("Getting skill history for userId={}, limit={}", userId, limit);
        if (!isAuthorized(userId, authentication)) return ResponseEntity.status(403).build();

        try {
            return ResponseEntity.ok(adaptiveDifficultyService.getSkillHistory(userId, limit));
        } catch (UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private boolean isAuthorized(Long userId, Authentication authentication) {
        if (authentication == null) return false;
        
        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN") || role.equals("ROLE_SUPER_ADMIN"));
        
        if (isAdmin) return true;

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        return user != null && user.getId().equals(userId);
    }
}
