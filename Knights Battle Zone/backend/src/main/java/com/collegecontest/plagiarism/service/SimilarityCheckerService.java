package com.collegecontest.plagiarism.service;

import com.collegecontest.model.Submission;
import com.collegecontest.plagiarism.model.PlagiarismFlag;
import com.collegecontest.plagiarism.repository.PlagiarismFlagRepository;
import com.collegecontest.repository.SubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SimilarityCheckerService {

    private final SubmissionRepository submissionRepository;
    private final PlagiarismFlagRepository flagRepository;
    private static final double SIMILARITY_THRESHOLD = 80.0;

    public SimilarityCheckerService(
            SubmissionRepository submissionRepository,
            PlagiarismFlagRepository flagRepository) {
        this.submissionRepository = submissionRepository;
        this.flagRepository = flagRepository;
    }

    @Transactional
    public void checkContestForPlagiarism(Long contestId) {
        List<Submission> submissions = submissionRepository.findByContestId(contestId);
        if (submissions == null || submissions.isEmpty()) {
            return;
        }

        for (int i = 0; i < submissions.size(); i++) {
            Submission submissionA = submissions.get(i);
            
            for (int j = i + 1; j < submissions.size(); j++) {
                Submission submissionB = submissions.get(j);
                
                if (submissionA.getProblem() == null || submissionB.getProblem() == null) {
                    continue;
                }
                if (!submissionA.getProblem().getId().equals(submissionB.getProblem().getId())) {
                    continue;
                }

                Long submissionId1 = Math.min(submissionA.getId(), submissionB.getId());
                Long submissionId2 = Math.max(submissionA.getId(), submissionB.getId());

                if (flagRepository.existsBySubmissionId1AndSubmissionId2(submissionId1, submissionId2)) {
                    continue;
                }

                double similarity = computeSimilarityPercentage(
                    submissionA.getCode(), 
                    submissionB.getCode()
                );

                if (similarity >= SIMILARITY_THRESHOLD) {
                    PlagiarismFlag flag = PlagiarismFlag.builder()
                            .submissionId1(submissionId1)
                            .submissionId2(submissionId2)
                            .similarityScore(similarity)
                            .status(PlagiarismFlag.Status.PENDING)
                            .createdAt(LocalDateTime.now())
                            .build();
                    
                    flagRepository.save(flag);
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<PlagiarismFlag> getPendingFlags() {
        return flagRepository.findByStatus(PlagiarismFlag.Status.PENDING);
    }

    @Transactional(readOnly = true)
    public List<PlagiarismFlag> getFlagsByContest(Long contestId) {
        return flagRepository.findByContestId(contestId);
    }

    @Transactional
    public void resolveFlag(Long flagId, String resolution) {
        PlagiarismFlag flag = flagRepository.findById(flagId)
                .orElseThrow(() -> new RuntimeException("Flag not found: " + flagId));
        
        flag.setStatus(PlagiarismFlag.Status.RESOLVED);
        flag.setResolution(resolution);
        flag.setResolvedAt(LocalDateTime.now());
        flagRepository.save(flag);
    }

    private double computeSimilarityPercentage(String codeA, String codeB) {
        if (codeA == null) codeA = "";
        if (codeB == null) codeB = "";
        
        String normalizedA = normalizeCode(codeA);
        String normalizedB = normalizeCode(codeB);
        
        int distance = levenshteinDistance(normalizedA, normalizedB);
        int maxLength = Math.max(normalizedA.length(), normalizedB.length());
        
        if (maxLength == 0) return 100.0;
        
        double normalizedDistance = 1.0 - ((double) distance / (double) maxLength);
        return normalizedDistance * 100.0;
    }

    private String normalizeCode(String code) {
        return code
            .replaceAll("\\s+", " ")
            .replaceAll("//.*?\\n", "\n")
            .replaceAll("/\\*.*?\\*/", "")
            .trim();
    }

    private int levenshteinDistance(String s1, String s2) {
        int[] prev = new int[s2.length() + 1];
        for (int j = 0; j <= s2.length(); j++) prev[j] = j;
        
        for (int i = 1; i <= s1.length(); i++) {
            int[] current = new int[s2.length() + 1];
            current[0] = i;
            
            for (int j = 1; j <= s2.length(); j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;
                current[j] = Math.min(
                    Math.min(current[j - 1] + 1, prev[j] + 1),
                    prev[j - 1] + cost
                );
            }
            prev = current;
        }
        return prev[s2.length()];
    }
}
