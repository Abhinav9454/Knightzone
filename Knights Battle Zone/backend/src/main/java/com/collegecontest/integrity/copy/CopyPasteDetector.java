package com.collegecontest.integrity.copy;

import com.collegecontest.util.RabinKarpRollingHash;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class CopyPasteDetector {

    private final KnownSnippetRepository knownSnippetRepository;
    private final SubmissionSnippetMatchRepository submissionSnippetMatchRepository;

    public CopyPasteDetector(KnownSnippetRepository knownSnippetRepository,
            SubmissionSnippetMatchRepository submissionSnippetMatchRepository) {
        this.knownSnippetRepository = knownSnippetRepository;
        this.submissionSnippetMatchRepository = submissionSnippetMatchRepository;
    }

    private String normalize(String code) {
        if (code == null) return "";
        
        // Remove single-line comments (//) and multi-line comments (/* */)
        String withoutComments = code;
        
        // Remove multi-line comments
        withoutComments = withoutComments.replaceAll("/\\*.*?\\*/", "");
        
        // Remove single-line comments (//) - using Pattern.MULTILINE
        String[] lines = withoutComments.split("\n");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            int idx = line.indexOf("//");
            if (idx >= 0) {
                sb.append(line.substring(0, idx)).append("\n");
            } else {
                sb.append(line).append("\n");
            }
        }
        withoutComments = sb.toString();
        
        // Remove Python-style comments (#)
        lines = withoutComments.split("\n");
        sb = new StringBuilder();
        for (String line : lines) {
            int idx = line.indexOf("#");
            if (idx >= 0) {
                sb.append(line.substring(0, idx)).append("\n");
            } else {
                sb.append(line).append("\n");
            }
        }
        withoutComments = sb.toString();
        
        // Normalize whitespace
        return withoutComments.replaceAll("\\s+", " ").trim();
    }

    @Transactional
    public void analyzeSubmission(Long submissionId, String code) {
        String normalized = normalize(code);
        if (normalized.isEmpty()) return;

        int window = 200; // characters per window
        Map<Integer, String> hashes = RabinKarpRollingHash.computeRollingHashes(normalized, window);
        Set<String> lookup = new HashSet<>(hashes.values());
        if (lookup.isEmpty()) return;

        List<KnownSnippet> matches = knownSnippetRepository.findBySnippetHashIn(new ArrayList<>(lookup));
        if (matches.isEmpty()) return;

        // Map hash -> KnownSnippet
        Map<String, KnownSnippet> map = new HashMap<>();
        for (KnownSnippet ks : matches) {
            map.put(ks.getSnippetHash(), ks);
        }

        int totalMatchedChars = 0;
        Map<Long, Integer> snippetMatchedChars = new HashMap<>();
        
        for (Map.Entry<Integer, String> entry : hashes.entrySet()) {
            String h = entry.getValue();
            KnownSnippet ks = map.get(h);
            if (ks != null) {
                int matched = Math.min(window, normalized.length() - entry.getKey());
                totalMatchedChars += matched;
                snippetMatchedChars.merge(ks.getId(), matched, Integer::sum);
            }
        }

        double totalPercent = 100.0 * totalMatchedChars / Math.max(1, normalized.length());
        double threshold = 30.0;
        LocalDateTime now = LocalDateTime.now();

        if (totalPercent >= threshold) {
            // Persist each snippet match
            for (Map.Entry<Long, Integer> si : snippetMatchedChars.entrySet()) {
                double matchPercent = 100.0 * si.getValue() / Math.max(1, normalized.length());
                
                SubmissionSnippetMatch m = SubmissionSnippetMatch.builder()
                        .submissionId(submissionId)
                        .snippetId(si.getKey())
                        .matchPercentage(matchPercent)
                        .createdAt(now)
                        .build();
                submissionSnippetMatchRepository.save(m);
            }
        }
    }
}
