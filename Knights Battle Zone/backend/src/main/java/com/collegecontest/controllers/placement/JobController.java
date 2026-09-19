package com.collegecontest.controllers.placement;

import com.collegecontest.model.User;
import com.collegecontest.models.placement.Application;
import com.collegecontest.models.placement.Job;
import com.collegecontest.repository.UserRepository;
import com.collegecontest.services.placement.ApplicationService;
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
@RequestMapping("/placement/jobs")
@RequiredArgsConstructor
public class JobController {
    private final JobService jobService;
    private final ApplicationService applicationService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Job> getOpenJobs() {
        return jobService.getAllOpenJobs();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Job getJob(@PathVariable Long id) {
        return jobService.getJobById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public Job createJob(@RequestBody Job job) {
        return jobService.createJob(job, currentUser().getId());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public Job updateJob(@PathVariable Long id, @RequestBody Job job) {
        return jobService.updateJob(id, job, currentUser().getId());
    }

    @PostMapping("/{jobId}/apply")
    @PreAuthorize("hasAnyRole('STUDENT','ADMIN','SUPER_ADMIN')")
    public Application apply(
            @PathVariable Long jobId,
            @RequestBody(required = false) Map<String, String> payload) {
        User user = currentUser();
        String resumeUrl = payload == null ? null : payload.get("resumeUrl");
        String coverLetter = payload == null ? null : payload.get("coverLetter");
        return applicationService.applyForStudent(jobId, user.getId(), resumeUrl, coverLetter);
    }

    @GetMapping("/{jobId}/applications")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public List<Application> getApplications(@PathVariable Long jobId) {
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
