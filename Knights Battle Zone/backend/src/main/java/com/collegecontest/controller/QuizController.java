package com.collegecontest.controller;

import com.collegecontest.dto.QuizDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import com.collegecontest.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/quizzes")
@Tag(name = "Quizzes", description = "Quiz management APIs")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @GetMapping
    @Operation(summary = "List all quizzes", responses = {
            @ApiResponse(responseCode = "200", description = "List returned") })
    public Page<QuizDTO> getAllQuizzes(
            @PageableDefault(size = 20, sort = "startTime", direction = Sort.Direction.DESC) Pageable pageable) {
        return quizService.getAllQuizzes(pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get quiz by id", responses = {
            @ApiResponse(responseCode = "200", description = "Quiz returned") })
    public QuizDTO getQuizById(@PathVariable Long id) {
        QuizDTO quiz = quizService.getQuizById(id);

        // Hide isCorrect field from students, only show to admins
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth ->
                        auth.getAuthority().equals("ROLE_ADMIN") ||
                        auth.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isAdmin && quiz.getQuestions() != null) {
            quiz.getQuestions().forEach(question -> {
                if (question.getOptions() != null) {
                    question.getOptions().forEach(option -> option.setIsCorrect(null));
                }
            });
        }

        return quiz;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Create a new quiz", responses = {
            @ApiResponse(responseCode = "200", description = "Quiz created") })
    public QuizDTO createQuiz(@RequestBody @jakarta.validation.Valid QuizDTO quizDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        return quizService.createQuiz(quizDTO, email);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Update quiz details/questions", responses = {
            @ApiResponse(responseCode = "200", description = "Quiz updated") })
    public QuizDTO updateQuiz(@PathVariable Long id, @RequestBody QuizDTO quizDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        return quizService.updateQuiz(id, quizDTO, email);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Delete quiz", responses = {
            @ApiResponse(responseCode = "204", description = "Quiz deleted") })
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        quizService.deleteQuiz(id, email);
        return ResponseEntity.noContent().build();
    }
}
