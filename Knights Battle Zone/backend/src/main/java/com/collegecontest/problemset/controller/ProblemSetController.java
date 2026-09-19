package com.collegecontest.problemset.controller;

import com.collegecontest.dto.ProblemDTO;
import com.collegecontest.problemset.dto.ProblemSetPageResponse;
import com.collegecontest.problemset.dto.ProblemSetUpsertRequest;
import com.collegecontest.problemset.service.ProblemSetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/problems/problem-set")
public class ProblemSetController {

    private final ProblemSetService problemSetService;

    public ProblemSetController(ProblemSetService problemSetService) {
        this.problemSetService = problemSetService;
    }

    @GetMapping
    public ProblemSetPageResponse listProblems(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "difficulty", required = false) String difficulty) {
        return problemSetService.getProblemSetPage(query, difficulty, page, size);
    }

    @GetMapping("/{id}")
    public ProblemDTO getProblem(@PathVariable Long id) {
        return problemSetService.getProblemInSet(id);
    }

    @GetMapping("/meta")
    public Map<String, Long> getMeta() {
        return Map.of("contestId", problemSetService.getProblemSetContestId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ProblemDTO createProblem(@Valid @RequestBody ProblemSetUpsertRequest request) {
        return problemSetService.createProblem(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ProblemDTO updateProblem(
            @PathVariable Long id,
            @Valid @RequestBody ProblemSetUpsertRequest request) {
        return problemSetService.updateProblem(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public void deleteProblem(@PathVariable Long id) {
        problemSetService.deleteProblem(id);
    }
}

