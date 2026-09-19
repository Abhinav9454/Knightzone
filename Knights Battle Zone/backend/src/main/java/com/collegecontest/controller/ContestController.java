package com.collegecontest.controller;

import com.collegecontest.dto.ContestAccessDTO;
import com.collegecontest.dto.ContestDTO;
import com.collegecontest.dto.ProblemDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
// model imports removed; controllers use DTOs only
import com.collegecontest.service.ContestService;
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
@RequestMapping("/contests")
@Tag(name = "Contests", description = "Contest management APIs")
public class ContestController {

    @Autowired
    private ContestService contestService;

    @GetMapping
    @Operation(summary = "List all contests", responses = {
            @ApiResponse(responseCode = "200", description = "List returned") })
    public Page<ContestDTO> getAllContests(
            @PageableDefault(size = 20, sort = "startTime", direction = Sort.Direction.DESC) Pageable pageable) {
        return contestService.getAllContests(pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get contest by id", responses = {
            @ApiResponse(responseCode = "200", description = "Contest returned") })
    public ContestDTO getContest(@PathVariable Long id) {
        return contestService.getContestById(id);
    }

    @PostMapping("/{id}/register")
    @Operation(summary = "Register and start contest timer for current user", responses = {
            @ApiResponse(responseCode = "200", description = "Contest access started") })
    public ContestAccessDTO registerContest(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        return contestService.registerForContest(id, email);
    }

    @GetMapping("/{id}/access")
    @Operation(summary = "Get current user's contest access/timer", responses = {
            @ApiResponse(responseCode = "200", description = "Contest access status returned") })
    public ContestAccessDTO getContestAccess(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        return contestService.getContestAccess(id, email);
    }

    @PostMapping
    @Operation(summary = "Create a new contest", responses = {
            @ApiResponse(responseCode = "200", description = "Contest created") })
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ContestDTO createContest(@RequestBody @jakarta.validation.Valid ContestDTO contestDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        return contestService.createContest(contestDTO, email);
    }

    @PostMapping("/{contestId}/problems")
    @Operation(summary = "Add a problem to a contest", responses = {
            @ApiResponse(responseCode = "200", description = "Problem added") })
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ProblemDTO addProblem(@PathVariable Long contestId,
            @RequestBody @jakarta.validation.Valid ProblemDTO problemDTO) {
        return contestService.addProblemToContest(contestId, problemDTO);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update contest timings/details", responses = {
            @ApiResponse(responseCode = "200", description = "Contest updated") })
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ContestDTO updateContest(@PathVariable Long id, @RequestBody ContestDTO contestDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        return contestService.updateContest(id, contestDTO, email);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete contest", responses = {
            @ApiResponse(responseCode = "204", description = "Contest deleted") })
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> deleteContest(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        contestService.deleteContest(id, email);
        return ResponseEntity.noContent().build();
    }
}
