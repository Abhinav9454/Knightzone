package com.collegecontest.controller;

import com.collegecontest.dto.SubmissionDTO;
import com.collegecontest.model.Submission;
import com.collegecontest.service.IdempotencyService;
import com.collegecontest.service.SubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/submissions")
@Tag(name = "Submissions", description = "Code submission APIs")
public class SubmissionController {

    @Autowired
    private SubmissionService submissionService;

    @Autowired
    private IdempotencyService idempotencyService;

    @PostMapping
    @Operation(summary = "Submit code for a problem", responses = {
            @ApiResponse(responseCode = "200", description = "Submission accepted") })
    public SubmissionDTO submitCode(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody @jakarta.validation.Valid SubmissionDTO submissionDTO) {
        String email = getAuthenticatedEmail();
        return idempotencyService.execute(
                "submission-submit",
                email,
                idempotencyKey,
                SubmissionDTO.class,
                () -> submissionService.submitCode(submissionDTO, email));
    }

    @PostMapping("/run")
    @Operation(summary = "Run code against sample input without saving submission", responses = {
            @ApiResponse(responseCode = "200", description = "Run result returned") })
    public SubmissionDTO runCode(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody @jakarta.validation.Valid SubmissionDTO submissionDTO) {
        String email = getAuthenticatedEmail();
        return idempotencyService.execute(
                "submission-run",
                email,
                idempotencyKey,
                SubmissionDTO.class,
                () -> submissionService.runCode(submissionDTO, email));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my submissions", responses = {
            @ApiResponse(responseCode = "200", description = "List returned") })
    public List<SubmissionDTO> getMySubmissions() {
        String email = getAuthenticatedEmail();
        return submissionService.getSubmissionsByUser(email);
    }

    @GetMapping("/problem/{problemId}")
    @Operation(summary = "Get submissions for a problem", responses = {
            @ApiResponse(responseCode = "200", description = "List returned") })
    public List<SubmissionDTO> getSubmissionsByProblem(@PathVariable Long problemId) {
        return submissionService.getSubmissionsByProblem(problemId);
    }

    private String getAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return authentication.getName();
    }
}
