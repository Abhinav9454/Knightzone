package com.collegecontest.repositories.placement;

import com.collegecontest.models.placement.Application;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByJobId(Long jobId);
    List<Application> findByStudentId(Long studentId);
    Optional<Application> findByJobIdAndStudentId(Long jobId, Long studentId);
    long countByStudentId(Long studentId);
    long countByStudentIdAndStatusIn(Long studentId, Collection<Application.Status> statuses);
    long countByStatus(Application.Status status);
}
