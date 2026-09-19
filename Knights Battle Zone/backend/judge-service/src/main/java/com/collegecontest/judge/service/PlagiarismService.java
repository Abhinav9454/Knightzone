package com.collegecontest.judge.service;

import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
public class PlagiarismService {
    // simple k-shingle Jaccard similarity
    public double similarity(String a, String b, int k) {
        if (a == null || b == null)
            return 0.0;
        String na = normalize(a);
        String nb = normalize(b);
        Set<String> sa = shingles(na, k);
        Set<String> sb = shingles(nb, k);
        if (sa.isEmpty() || sb.isEmpty())
            return 0.0;
        Set<String> inter = new HashSet<>(sa);
        inter.retainAll(sb);
        Set<String> union = new HashSet<>(sa);
        union.addAll(sb);
        return (double) inter.size() / (double) union.size();
    }

    private String normalize(String s) {
        // remove common punctuation and whitespace, to lower case
        return s.replaceAll("(?s)/\\*.*?\\*/", "") // remove block comments
                .replaceAll("(?m)//.*$", "") // remove line comments
                .replaceAll("\\s+", " ")
                .replaceAll("[^a-zA-Z0-9 ]", " ")
                .toLowerCase()
                .trim();
    }

    private Set<String> shingles(String s, int k) {
        Set<String> out = new HashSet<>();
        String compact = s.replaceAll(" ", "");
        for (int i = 0; i + k <= compact.length(); i++) {
            out.add(compact.substring(i, i + k));
        }
        return out;
    }
}
