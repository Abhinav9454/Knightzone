package com.collegecontest.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

/**
 * Simple rolling-hash utilities. We use a polynomial rolling hash for sliding
 * windows
 * and an MD5 fingerprint for full-block hashing when needed.
 */
public class RabinKarpRollingHash {
    private static final long BASE = 257L;
    private static final long MOD = 1_000_000_007L;

    public static Map<Integer, String> computeRollingHashes(String text, int windowSize) {
        Map<Integer, String> result = new LinkedHashMap<>();
        if (text == null || text.length() == 0 || windowSize <= 0)
            return result;
        int n = text.length();
        if (windowSize > n)
            windowSize = n;
        long hash = 0;
        long pow = 1;
        for (int i = 0; i < windowSize; i++) {
            hash = (hash * BASE + text.charAt(i)) % MOD;
            if (i > 0)
                pow = (pow * BASE) % MOD;
        }
        result.put(0, Long.toHexString(hash));
        for (int i = windowSize; i < n; i++) {
            int start = i - windowSize + 1;
            // remove leading char
            long lead = (text.charAt(start - 1) * pow) % MOD;
            hash = (MOD + hash - lead) % MOD;
            hash = (hash * BASE + text.charAt(i)) % MOD;
            result.put(start, Long.toHexString(hash));
        }
        return result;
    }

    public static String md5Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : digest)
                sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
