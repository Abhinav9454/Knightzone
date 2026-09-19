package com.collegecontest.services.placement;

import com.collegecontest.models.placement.Application;
import com.collegecontest.models.placement.Job;
import com.collegecontest.repositories.placement.ApplicationRepository;
import com.collegecontest.repositories.placement.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;

    public Map<String, Object> studentDashboard(Long studentId) {
        LocalDateTime now = LocalDateTime.now();
        long totalJobs = jobRepository.count();
        long openJobs = jobRepository.countActiveByStatus(Job.Status.OPEN, now);
        long myApplications = applicationRepository.countByStudentId(studentId);
        long interviewsScheduled = applicationRepository.countByStudentIdAndStatusIn(
                studentId,
                List.of(Application.Status.SHORTLISTED, Application.Status.SELECTED));
        long companiesHiring = jobRepository.countDistinctCompanyIdByStatus(Job.Status.OPEN, now);

        return Map.of(
                "totalJobs", totalJobs,
                "openJobs", openJobs,
                "myApplications", myApplications,
                "interviewsScheduled", interviewsScheduled,
                "companiesHiring", companiesHiring);
    }

    public Map<String, Object> companyDashboard() {
        LocalDateTime now = LocalDateTime.now();
        long totalJobs = jobRepository.count();
        long openJobs = jobRepository.countActiveByStatus(Job.Status.OPEN, now);
        long totalApplications = applicationRepository.count();
        long shortlisted = applicationRepository.countByStatus(Application.Status.SHORTLISTED);

        return Map.of(
                "totalJobs", totalJobs,
                "openJobs", openJobs,
                "totalApplications", totalApplications,
                "shortlisted", shortlisted);
    }

    public Map<String, Object> tpoDashboard() {
        LocalDateTime now = LocalDateTime.now();
        return Map.of(
                "totalJobs", jobRepository.count(),
                "openJobs", jobRepository.countActiveByStatus(Job.Status.OPEN, now),
                "totalApplications", applicationRepository.count(),
                "companiesHiring", jobRepository.countDistinctCompanyIdByStatus(Job.Status.OPEN, now));
    }
}
