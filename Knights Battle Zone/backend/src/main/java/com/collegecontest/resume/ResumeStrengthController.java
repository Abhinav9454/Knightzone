package com.collegecontest.resume;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users/{userId}/resume-strength")
public class ResumeStrengthController {

    private final ResumeStrengthService service;

    public ResumeStrengthController(ResumeStrengthService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ResumeStrengthDTO> get(@PathVariable Long userId) {
        ResumeStrengthDTO dto = service.getResumeStrength(userId);
        return ResponseEntity.ok(dto);
    }
}
