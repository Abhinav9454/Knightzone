package com.collegecontest.services.placement;

import com.collegecontest.models.placement.Job;
import com.collegecontest.repositories.placement.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {
    private final JobRepository jobRepository;

    public Job createJob(Job job, Long actorUserId) {
        Job prepared = prepareForSave(job, actorUserId, false);
        return jobRepository.save(prepared);
    }

    public Job updateJob(Long jobId, Job job, Long actorUserId) {
        Job existing = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        Job prepared = prepareForSave(job, actorUserId, true);
        prepared.setId(existing.getId());
        if (prepared.getPostedDate() == null) {
            prepared.setPostedDate(existing.getPostedDate());
        }
        return jobRepository.save(prepared);
    }

    public List<Job> getAllOpenJobs() {
        return jobRepository.findActiveByStatus(Job.Status.OPEN, LocalDateTime.now());
    }

    public List<Job> getJobsByCompany(Long companyId) {
        return jobRepository.findByCompanyId(companyId);
    }

    public Job getJobById(Long jobId) {
        return jobRepository.findById(jobId).orElse(null);
    }

    public void closeJob(Long jobId) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(Job.Status.CLOSED);
            jobRepository.save(job);
        });
    }

    private Job prepareForSave(Job job, Long actorUserId, boolean forUpdate) {
        if (job == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job payload is required");
        }

        String title = normalize(job.getTitle());
        if (title == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job title is required");
        }

        if (job.getCompanyId() == null) {
            job.setCompanyId(actorUserId);
        }
        if (job.getCompanyId() == null || job.getCompanyId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid companyId is required");
        }

        job.setTitle(title);
        job.setCompanyName(normalize(job.getCompanyName()));
        job.setDescription(normalize(job.getDescription()));
        job.setEligibilityCriteria(normalize(job.getEligibilityCriteria()));
        job.setLocation(normalize(job.getLocation()));
        job.setSalary(normalize(job.getSalary()));

        if (job.getStatus() == null) {
            job.setStatus(Job.Status.OPEN);
        }

        if (!forUpdate && job.getPostedDate() == null) {
            job.setPostedDate(LocalDateTime.now());
        }
        return job;
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
