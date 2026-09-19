package com.collegecontest.service;

import com.collegecontest.model.Submission;
import com.collegecontest.repository.SubmissionRepository;
import com.collegecontest.util.CodeAnalyzer;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReadabilityService {

    private final SubmissionRepository submissionRepository;
    private final CodeAnalyzer codeAnalyzer;

    // weights
    private final double lineLengthWeight = 0.2;
    private final double commentWeight = 0.2;
    private final double namingWeight = 0.3;
    private final double complexityWeight = 0.3;

    public ReadabilityService(SubmissionRepository submissionRepository, CodeAnalyzer codeAnalyzer) {
        this.submissionRepository = submissionRepository;
        this.codeAnalyzer = codeAnalyzer;
    }

    @Transactional
    @Cacheable(value = "readability", key = "#submissionId")
    public Double getReadabilityScore(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found: " + submissionId));

        String lang = submission.getLanguage() == null ? "" : submission.getLanguage().toLowerCase();
        String code = submission.getCode() == null ? "" : submission.getCode();

        if (!(lang.contains("java") || lang.contains("py") || lang.contains("python") || lang.contains("js")
                || lang.contains("cpp") || lang.contains("c++"))) {
            submission.setReadabilityScore(0.0);
            submissionRepository.save(submission);
            return 0.0;
        }

        String normalized = codeAnalyzer.normalizeCode(code);
        if (normalized.isBlank()) {
            submission.setReadabilityScore(0.0);
            submissionRepository.save(submission);
            return 0.0;
        }

        String[] lines = normalized.split("\\R");
        double avgLineLength = normalized.length() / (double) Math.max(1, lines.length);
        double lineScore = Math.max(0.0, 100.0 - Math.abs(avgLineLength - 55.0) * 2.0);
        lineScore = Math.min(100.0, lineScore);

        long commentMarkers = countOccurrences(code, "//") + countOccurrences(code, "/*");
        double commentRatio = commentMarkers / (double) Math.max(1, lines.length);
        double commentScore = Math.max(0.0, Math.min(100.0, commentRatio * 100.0));

        double namingScore = normalized.matches(".*[a-zA-Z_][a-zA-Z0-9_]*.*") ? 75.0 : 40.0;

        int cyclo = estimateCyclomatic(code);
        double complexityScore;
        if (cyclo <= 5)
            complexityScore = 100.0;
        else if (cyclo <= 10)
            complexityScore = 80.0;
        else if (cyclo <= 20)
            complexityScore = 50.0;
        else
            complexityScore = 20.0;

        double weighted = lineLengthWeight * lineScore
                + commentWeight * commentScore
                + namingWeight * namingScore
                + complexityWeight * complexityScore;

        double finalScore = Math.max(0.0, Math.min(100.0, weighted));

        submission.setReadabilityScore(finalScore);
        submissionRepository.save(submission);

        return finalScore;
    }

    private int estimateCyclomatic(String code) {
        String lower = code.toLowerCase();
        return 1
                + countOccurrences(lower, " if ")
                + countOccurrences(lower, " for ")
                + countOccurrences(lower, " while ")
                + countOccurrences(lower, " case ")
                + countOccurrences(lower, "&&")
                + countOccurrences(lower, "||");
    }

    private int countOccurrences(String text, String token) {
        if (text == null || text.isEmpty() || token == null || token.isEmpty()) {
            return 0;
        }
        int count = 0;
        int idx = 0;
        while ((idx = text.indexOf(token, idx)) != -1) {
            count++;
            idx += token.length();
        }
        return count;
    }
}

