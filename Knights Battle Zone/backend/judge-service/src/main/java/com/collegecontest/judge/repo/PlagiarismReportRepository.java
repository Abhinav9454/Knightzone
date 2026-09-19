package com.collegecontest.judge.repo;

import com.collegecontest.judge.model.PlagiarismReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlagiarismReportRepository extends JpaRepository<PlagiarismReport, Long> {
    List<PlagiarismReport> findByProblemIdOrderBySimilarityDesc(Long problemId);
}
