package com.collegecontest.service;

import com.collegecontest.model.Submission;
import com.collegecontest.repository.SubmissionRepository;
import com.collegecontest.util.CodeComplexityAnalyzer;
import com.collegecontest.util.CodeComplexityAnalyzer.Result;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ComplexityEstimatorService {

    private final SubmissionRepository submissionRepository;

    public ComplexityEstimatorService(SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    @Transactional
    @Cacheable(value = "complexity", key = "#submissionId")
    public String estimateComplexity(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found: " + submissionId));

        String lang = submission.getLanguage() == null ? "" : submission.getLanguage().toLowerCase();
        String code = submission.getCode() == null ? "" : submission.getCode();

        Result res;
        if (lang.contains("java")) {
            res = CodeComplexityAnalyzer.analyzeJava(code);
        } else if (lang.contains("py") || lang.contains("python")) {
            res = CodeComplexityAnalyzer.analyzePython(code);
        } else {
            submission.setTimeComplexity("O(1)");
            submissionRepository.save(submission);
            return submission.getTimeComplexity();
        }

        // Determine complexity from loop depth
        int loopDepth = res.maxLoopDepth; // 0 means no loops
        String loopComplexity = "O(1)";
        if (loopDepth <= 0)
            loopComplexity = "O(1)";
        else if (loopDepth == 1)
            loopComplexity = "O(n)";
        else
            loopComplexity = "O(n^" + loopDepth + ")";

        // Determine recursion complexity
        String recComplexity = null;
        if (res.hasRecursion) {
            if (res.recursionCalls >= 2) {
                if (res.recursionDivides) {
                    // heuristic: divide-and-conquer with multiple calls -> O(n log n)
                    recComplexity = "O(n log n)";
                } else {
                    recComplexity = "O(2^n)";
                }
            } else { // single recursive call
                if (res.recursionDivides)
                    recComplexity = "O(log n)";
                else
                    recComplexity = "O(n)";
            }
            if (res.recursionInsideLoop) {
                // recursion inside loop likely multiplies complexity; prefer worse
                if (recComplexity.equals("O(log n)"))
                    recComplexity = "O(n log n)";
                else if (recComplexity.equals("O(n)"))
                    recComplexity = "O(n^2)";
                else
                    recComplexity = "O(2^n)";
            }
        }

        // Combine loop and recursion: pick worst growth
        String finalComplexity = loopComplexity;
        if (recComplexity != null) {
            finalComplexity = pickWorseComplexity(loopComplexity, recComplexity);
        }

        submission.setTimeComplexity(finalComplexity);
        submissionRepository.save(submission);
        return finalComplexity;
    }

    private String pickWorseComplexity(String a, String b) {
        // ranking order: O(1) < O(log n) < O(n) < O(n log n) < O(n^2) < O(n^3) < O(2^n)
        int ra = rank(a);
        int rb = rank(b);
        if (ra >= rb)
            return a;
        return b;
    }

    private int rank(String c) {
        if (c == null)
            return 0;
        if (c.contains("2^n") || c.contains("2^n"))
            return 7;
        if (c.contains("n^3"))
            return 6;
        if (c.contains("n^2"))
            return 5;
        if (c.contains("n log") || c.contains("nlog"))
            return 4;
        if (c.equals("O(n)"))
            return 3;
        if (c.contains("log n") || c.contains("log"))
            return 2;
        if (c.contains("1)") || c.equals("O(1)"))
            return 1;
        // fallback: try to detect exponent
        if (c.matches(".*n\\^\\d+.*")) {
            // extract exponent
            Pattern p = Pattern.compile("n\\^(\\d+)");
            Matcher m = p.matcher(c);
            if (m.find()) {
                int e = Integer.parseInt(m.group(1));
                return Math.min(6, 2 + e);
            }
        }
        return 3; // default to O(n)
    }
}
