package com.collegecontest.services.placement;

import com.collegecontest.models.placement.Application;
import com.collegecontest.models.placement.Job;
import com.collegecontest.repositories.placement.ApplicationRepository;
import com.collegecontest.repositories.placement.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;

    public Application apply(Application application) {
        return applicationRepository.save(application);
    }

    public Application applyForStudent(Long jobId, Long studentId, String resumeUrl, String coverLetter) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (job.getStatus() != Job.Status.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job is closed");
        }

        if (job.getDeadline() != null && job.getDeadline().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job application deadline has passed");
        }

        if (applicationRepository.findByJobIdAndStudentId(jobId, studentId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already applied for this job");
        }

        Application application = new Application();
        application.setJobId(jobId);
        application.setStudentId(studentId);
        application.setStatus(Application.Status.APPLIED);

        StringBuilder notes = new StringBuilder();
        if (resumeUrl != null && !resumeUrl.isBlank()) {
            notes.append("resumeUrl=").append(resumeUrl.trim());
        }
        if (coverLetter != null && !coverLetter.isBlank()) {
            if (!notes.isEmpty()) {
                notes.append(" | ");
            }
            notes.append("coverLetter=").append(coverLetter.trim());
        }
        if (!notes.isEmpty()) {
            application.setComments(notes.toString());
        }

        return applicationRepository.save(application);
    }

    public List<Application> getApplicationsForJob(Long jobId) {
        return applicationRepository.findByJobId(jobId);
    }

    public List<Application> getApplicationsForStudent(Long studentId) {
        return applicationRepository.findByStudentId(studentId);
    }

    public Application updateStatus(Long applicationId, Application.Status status, String comments) {
        Application app = applicationRepository.findById(applicationId).orElseThrow();
        app.setStatus(status);
        app.setComments(comments);
        return applicationRepository.save(app);
    }
}
