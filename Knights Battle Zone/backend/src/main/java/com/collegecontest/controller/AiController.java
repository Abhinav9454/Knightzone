package com.collegecontest.controller;

import com.collegecontest.ai.dto.AiUseRequest;
import com.collegecontest.ai.dto.AiUsageResponse;
import com.collegecontest.ai.service.AiUsageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai")
public class AiController {

    private final AiUsageService aiUsageService;

    public AiController(AiUsageService aiUsageService) {
        this.aiUsageService = aiUsageService;
    }

    @PostMapping("/use")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AiUsageResponse> useAi(
            @Valid @RequestBody AiUseRequest request,
            Authentication authentication) {
        AiUsageResponse response = aiUsageService.useAi(authentication.getName(), request);
        HttpStatus status = response.isAllowed() ? HttpStatus.OK : HttpStatus.TOO_MANY_REQUESTS;
        return ResponseEntity.status(status).body(response);
    }

    @GetMapping("/quota")
    @PreAuthorize("isAuthenticated()")
    public AiUsageResponse getAiQuota(Authentication authentication) {
        return aiUsageService.getQuota(authentication.getName());
    }
}
