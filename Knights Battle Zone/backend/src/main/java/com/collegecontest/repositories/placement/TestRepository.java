package com.collegecontest.repositories.placement;

import com.collegecontest.models.placement.Test;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestRepository extends JpaRepository<Test, Long> {
    List<Test> findByJobId(Long jobId);
}
