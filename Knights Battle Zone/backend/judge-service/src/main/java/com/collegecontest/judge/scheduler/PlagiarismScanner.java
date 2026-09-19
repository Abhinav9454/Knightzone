package com.collegecontest.judge.scheduler;

import com.collegecontest.judge.model.PlagiarismReport;
import com.collegecontest.judge.model.Submission;
import com.collegecontest.judge.repo.PlagiarismReportRepository;
import com.collegecontest.judge.repo.SubmissionRepository;
import com.collegecontest.judge.service.PlagiarismService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class PlagiarismScanner {
    private static final Logger log = LoggerFactory.getLogger(PlagiarismScanner.class);

    private final SubmissionRepository submissionRepo;
    private final PlagiarismReportRepository reportRepo;
    private final PlagiarismService plagiarismService;

    public PlagiarismScanner(SubmissionRepository submissionRepo, PlagiarismReportRepository reportRepo,
            PlagiarismService plagiarismService) {
        this.submissionRepo = submissionRepo;
        this.reportRepo = reportRepo;
        this.plagiarismService = plagiarismService;
    }

    // run every hour by default; configurable via property
    @Scheduled(fixedDelayString = "${plagiarism.scan.interval.ms:3600000}")
    public void scanAllProblems() {
        try {
            // find distinct problemIds from accepted submissions
            List<Long> problemIds = submissionRepo.findDistinctProblemIdsByStatus("ACCEPTED");
            for (Long pid : problemIds) {
                scanProblem(pid);
            }
        } catch (Exception e) {
            log.error("Plagiarism scan failed", e);
        }
    }

    public void scanProblem(Long problemId) {
        List<Submission> subs = submissionRepo.findByProblemIdAndStatus(problemId, "ACCEPTED");
        for (int i = 0; i < subs.size(); i++) {
            Submission a = subs.get(i);
            for (int j = i + 1; j < subs.size(); j++) {
                Submission b = subs.get(j);
                double sim = plagiarismService.similarity(a.getCode(), b.getCode(), 8);
                boolean flagged = sim >= 0.6; // threshold
                // save report
                PlagiarismReport r = new PlagiarismReport();
                r.setProblemId(problemId);
                r.setSubmissionA(a.getId());
                r.setSubmissionB(b.getId());
                r.setSimilarity(sim);
                r.setFlagged(flagged);
                r.setCreatedAt(Instant.now());
                reportRepo.save(r);
                if (flagged) {
                    log.warn("Plagiarism flagged {} vs {} (sim={})", a.getId(), b.getId(), sim);
                }
            }
        }
    }
}
