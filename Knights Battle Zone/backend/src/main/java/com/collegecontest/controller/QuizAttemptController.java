package com.collegecontest.controller;

import com.collegecontest.dto.QuizAttemptDTO;
import com.collegecontest.model.QuizAttempt;
import com.collegecontest.service.QuizAttemptService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quiz-attempts")
@Tag(name = "QuizAttempts", description = "Quiz attempt APIs")
public class QuizAttemptController {

    @Autowired
    private QuizAttemptService quizAttemptService;

    @PostMapping
    @Operation(summary = "Submit a quiz attempt", responses = {
            @ApiResponse(responseCode = "200", description = "Attempt submitted") })
    public QuizAttemptDTO submitAttempt(@RequestBody @jakarta.validation.Valid QuizAttemptDTO attemptDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        return quizAttemptService.submitAttempt(attemptDTO, email);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get quiz attempt by id", responses = {
            @ApiResponse(responseCode = "200", description = "Attempt returned") })
    public QuizAttemptDTO getAttemptById(@PathVariable Long id) {
        return quizAttemptService.getAttemptById(id);
    }

    @GetMapping("/my")
    @Operation(summary = "Get my quiz attempts", responses = {
            @ApiResponse(responseCode = "200", description = "List returned") })
    public List<QuizAttemptDTO> getMyAttempts() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        return quizAttemptService.getAttemptsByUser(email);
    }
}
