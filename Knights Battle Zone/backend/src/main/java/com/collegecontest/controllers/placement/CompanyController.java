package com.collegecontest.controllers.placement;

import com.collegecontest.model.User;
import com.collegecontest.models.placement.Application;
import com.collegecontest.models.placement.Job;
import com.collegecontest.repository.UserRepository;
import com.collegecontest.services.placement.ApplicationService;
import com.collegecontest.services.placement.DashboardService;
import com.collegecontest.services.placement.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/placement/company")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CompanyController {
    private final JobService jobService;
    private final ApplicationService applicationService;
    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return dashboardService.companyDashboard();
    }

    @PostMapping("/jobs")
    public Job createJob(@RequestBody Job job) {
        return jobService.createJob(job, currentUser().getId());
    }

    @GetMapping("/jobs")
    public List<Job> jobs(@RequestParam Long companyId) {
        return jobService.getJobsByCompany(companyId);
    }

    @GetMapping("/jobs/{jobId}/applications")
    public List<Application> applications(@PathVariable Long jobId) {
        return applicationService.getApplicationsForJob(jobId);
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
