package com.collegecontest.service;

import com.collegecontest.model.Submission;
import com.collegecontest.repository.SubmissionRepository;
import com.collegecontest.util.CodeComplexityAnalyzer;
import com.collegecontest.util.CodeSpaceAnalyzer;
import com.collegecontest.util.CodeSpaceAnalyzer.SpaceResult;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SpaceAnalyzerService {

    private final SubmissionRepository submissionRepository;

    public SpaceAnalyzerService(SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    @Transactional
    @Cacheable(value = "spaceAnalysis", key = "#submissionId")
    public String estimateSpaceComplexity(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found: " + submissionId));

        String lang = submission.getLanguage() == null ? "" : submission.getLanguage().toLowerCase();
        String code = submission.getCode() == null ? "" : submission.getCode();

        // Analyze allocations and recursion
        SpaceResult sr;
        if (lang.contains("java"))
            sr = CodeSpaceAnalyzer.analyzeJava(code);
        else if (lang.contains("py") || lang.contains("python"))
            sr = CodeSpaceAnalyzer.analyzePython(code);
        else {
            submission.setSpaceComplexity("O(1)");
            submissionRepository.save(submission);
            return submission.getSpaceComplexity();
        }

        // Determine allocation complexity
        String allocComplexity = "O(1)";
        if (sr.allocationCount > 0) {
            allocComplexity = "O(n)"; // default for collections
            if (sr.allocationInsideLoop)
                allocComplexity = "O(n^2)"; // heuristic
        }

        // Determine recursion space
        String recComplexity = null;
        if (sr.hasRecursion) {
            if (sr.recursionDivides)
                recComplexity = "O(log n)";
            else
                recComplexity = "O(n)"; // recursion depth proportional to n (heuristic)
        }

        // Combine: pick worst
        String finalComplexity = allocComplexity;
        if (recComplexity != null)
            finalComplexity = pickWorseComplexity(allocComplexity, recComplexity);

        submission.setSpaceComplexity(finalComplexity);
        submissionRepository.save(submission);
        return finalComplexity;
    }

    private String pickWorseComplexity(String a, String b) {
        int ra = rank(a);
        int rb = rank(b);
        if (ra >= rb)
            return a;
        return b;
    }

    private int rank(String c) {
        if (c == null)
            return 0;
        if (c.contains("n^2"))
            return 4;
        if (c.contains("n") && !c.contains("log"))
            return 3;
        if (c.contains("log"))
            return 2;
        if (c.contains("1"))
            return 1;
        return 3;
    }
}
