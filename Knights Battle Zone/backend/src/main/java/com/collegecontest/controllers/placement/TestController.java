package com.collegecontest.controllers.placement;

import com.collegecontest.models.placement.Test;
import com.collegecontest.services.placement.TestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/placement/tests")
@RequiredArgsConstructor
public class TestController {
    private final TestService testService;

    @PostMapping
    public Test schedule(@RequestBody Test test) {
        return testService.scheduleTest(test);
    }

    @GetMapping
    public List<Test> byJob(@RequestParam Long jobId) {
        return testService.getTestsForJob(jobId);
    }
}
