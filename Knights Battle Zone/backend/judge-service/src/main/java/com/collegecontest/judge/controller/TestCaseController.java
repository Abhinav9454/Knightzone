package com.collegecontest.judge.controller;

import com.collegecontest.judge.cache.CacheService;
import com.collegecontest.judge.model.TestCase;
import com.collegecontest.judge.repo.TestCaseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/testcases")
public class TestCaseController {
    private final TestCaseRepository repo;
    private final CacheService cacheService;

    public TestCaseController(TestCaseRepository repo, CacheService cacheService) {
        this.repo = repo;
        this.cacheService = cacheService;
    }

    @GetMapping("/problem/{problemId}")
    public ResponseEntity<List<TestCase>> getByProblemId(@PathVariable String problemId) {
        return ResponseEntity.ok(repo.findByProblemId(problemId));
    }

    @PostMapping
    public ResponseEntity<TestCase> create(@RequestBody TestCase t) {
        TestCase saved = repo.save(t);
        cacheService.invalidateProblem(saved.getProblemId());
        return ResponseEntity.created(URI.create("/api/testcases/" + saved.getId())).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TestCase> update(@PathVariable Long id, @RequestBody TestCase t) {
        return repo.findById(id).map(existing -> {
            existing.setInputData(t.getInputData());
            existing.setExpectedOutput(t.getExpectedOutput());
            existing.setHidden(t.isHidden());
            TestCase saved = repo.save(existing);
            cacheService.invalidateProblem(saved.getProblemId());
            return ResponseEntity.ok(saved);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return repo.findById(id).map(existing -> {
            repo.delete(existing);
            cacheService.invalidateProblem(existing.getProblemId());
            return ResponseEntity.noContent().build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
