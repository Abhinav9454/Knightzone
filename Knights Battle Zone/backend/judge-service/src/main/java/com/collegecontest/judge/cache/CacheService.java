package com.collegecontest.judge.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
public class CacheService {
    private static final Logger log = LoggerFactory.getLogger(CacheService.class);
    private final RedisTemplate<String, String> redis;
    private final ObjectMapper mapper = new ObjectMapper();

    public CacheService(@Qualifier("redisTemplate") RedisTemplate<String, String> redis) {
        this.redis = redis;
    }

    private String hashKey(String problemId, String language, String code) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(problemId.getBytes(StandardCharsets.UTF_8));
            md.update((byte) ':');
            md.update(language.getBytes(StandardCharsets.UTF_8));
            md.update((byte) ':');
            md.update(code.getBytes(StandardCharsets.UTF_8));
            byte[] dig = md.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : dig)
                sb.append(String.format("%02x", b));
            return "submission_cache:" + problemId + ":" + sb.toString();
        } catch (Exception e) {
            log.warn("Failed to compute hash", e);
            return "submission_cache:unknown:" + Math.abs((problemId + language + code).hashCode());
        }
    }

    public String getCached(String problemId, String language, String code) {
        String key = hashKey(problemId, language, code);
        try {
            return redis.opsForValue().get(key);
        } catch (Exception e) {
            log.warn("Redis get failed", e);
            return null;
        }
    }

    public void putCached(String problemId, String language, String code, String payload, long ttlSeconds) {
        String key = hashKey(problemId, language, code);
        try {
            redis.opsForValue().set(key, payload, ttlSeconds, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("Redis put failed", e);
        }
    }

    public void invalidateProblem(String problemId) {
        try {
            String pattern = "submission_cache:" + problemId + ":*";
            Set<String> keys = redis.keys(pattern);
            if (keys != null && !keys.isEmpty())
                redis.delete(keys);
        } catch (Exception e) {
            log.warn("Redis invalidate failed", e);
        }
    }
}
