package com.collegecontest.suspicious.service;

import com.collegecontest.model.Submission;
import com.collegecontest.plagiarism.repository.PlagiarismFlagRepository;
import com.collegecontest.repository.SubmissionRepository;
import com.collegecontest.suspicious.model.SuspiciousActivity;
import com.collegecontest.suspicious.repository.SuspiciousActivityRepository;
import com.collegecontest.service.IPMonitorService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SuspiciousActivityService {

    private final SubmissionRepository submissionRepository;
    private final SuspiciousActivityRepository suspiciousActivityRepository;
    private final IPMonitorService ipMonitorService;

    public SuspiciousActivityService(SubmissionRepository submissionRepository,
            SuspiciousActivityRepository suspiciousActivityRepository,
            IPMonitorService ipMonitorService) {
        this.submissionRepository = submissionRepository;
        this.suspiciousActivityRepository = suspiciousActivityRepository;
        this.ipMonitorService = ipMonitorService;
    }

    @Transactional
    public void analyzeUserActivity(Long userId, Long contestId) {
        List<Submission> subs = submissionRepository.findByUserIdOrderBySubmittedAtDesc(userId).stream()
                .filter(s -> s.getProblem() != null && s.getProblem().getContest() != null
                        && s.getProblem().getContest().getId().equals(contestId))
                .collect(Collectors.toList());

        if (subs.isEmpty())
            return;

        // Heuristic 1: rapid submissions (per minute)
        long withinMinute = subs.stream().limit(20)
                .filter(s -> s.getSubmittedAt().isAfter(LocalDateTime.now().minusMinutes(1))).count();
        double rate = (double) withinMinute; // submissions in last minute
        double rapidScore = 0.0;
        if (rate > 5.0)
            rapidScore = Math.min(1.0, (rate - 5.0) / 10.0);

        // Heuristic 2: identical error messages
        Map<String, Long> errorCounts = subs.stream().map(Submission::getOutput).filter(o -> o != null)
                .collect(Collectors.groupingBy(o -> o, Collectors.counting()));
        long maxSameError = errorCounts.values().stream().mapToLong(Long::longValue).max().orElse(0);
        double errorScore = Math.min(1.0, (double) maxSameError / 10.0);

        // Heuristic 3: IP sharing
        double ipScore = 0.0;
        try {
            String ip = subs.get(0).getOutput(); // placeholder; ideally submission stores ip
            List<Long> shared = ipMonitorService.getUsersSharingIpInContest(ip, contestId, 2);
            if (shared != null && shared.size() > 2) {
                ipScore = Math.min(1.0, shared.size() / 10.0);
            }
        } catch (Exception e) {
            // ignore
        }

        // Heuristic 4: consistent inter-submission times (low variance)
        List<Long> deltas = subs.stream().map(s -> s.getSubmittedAt()).collect(Collectors.toList()).stream()
                .map(t -> t.toEpochSecond(java.time.ZoneOffset.UTC)).collect(Collectors.toList()).stream()
                .mapToLong(Long::longValue).boxed().collect(Collectors.toList());
        double timeScore = 0.0;
        if (deltas.size() >= 3) {
            // compute variance
            DoubleSummaryStatistics stats = deltas.stream().mapToDouble(Long::doubleValue).summaryStatistics();
            double mean = stats.getAverage();
            double variance = deltas.stream().mapToDouble(d -> (d - mean) * (d - mean)).sum() / deltas.size();
            double std = Math.sqrt(variance);
            // low std implies botlike
            if (std < 5.0)
                timeScore = 1.0;
            else if (std < 30.0)
                timeScore = 0.5;
        }

        double total = 0.4 * rapidScore + 0.3 * errorScore + 0.2 * ipScore + 0.1 * timeScore;

        if (total > 0.7) {
            SuspiciousActivity act = new SuspiciousActivity();
            act.setUserId(userId);
            act.setContestId(contestId);
            act.setReason("Automated heuristics triggered");
            act.setScore(total);
            act.setDetails("rapid=" + rapidScore + ",error=" + errorScore + ",ip=" + ipScore + ",time=" + timeScore);
            act.setCreatedAt(LocalDateTime.now());
            suspiciousActivityRepository.save(act);
        }
    }

    public List<SuspiciousActivity> getUnresolvedFlags() {
        return suspiciousActivityRepository.findByResolvedFalse();
    }
}
