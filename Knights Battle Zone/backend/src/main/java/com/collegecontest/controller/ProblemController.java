package com.collegecontest.controller;

import com.collegecontest.dto.ProblemDTO;
import com.collegecontest.model.Problem;
import com.collegecontest.service.ProblemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/problems")
@Tag(name = "Problems", description = "Problem retrieval APIs")
public class ProblemController {

    @Autowired
    private ProblemService problemService;

    @GetMapping("/{id}")
    @Operation(summary = "Get problem by id", responses = {
            @ApiResponse(responseCode = "200", description = "Problem returned") })
    public ProblemDTO getProblemById(@PathVariable Long id) {
        return problemService.getProblemById(id);
    }

    @GetMapping("/contest/{contestId}")
    @Operation(summary = "List problems for a contest", responses = {
            @ApiResponse(responseCode = "200", description = "List returned") })
    public List<ProblemDTO> getProblemsByContest(@PathVariable Long contestId) {
        return problemService.getProblemsByContest(contestId);
    }
}
