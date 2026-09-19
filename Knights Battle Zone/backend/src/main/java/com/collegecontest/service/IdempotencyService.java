package com.collegecontest.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

@Service
public class IdempotencyService {

    private static final Logger logger = LoggerFactory.getLogger(IdempotencyService.class);
    private static final String CACHE_PREFIX = "idempotency";
    private static final String LOCK_SUFFIX = ":lock";

    private final ObjectMapper objectMapper;
    private final Map<String, LocalEntry> localCache = new ConcurrentHashMap<>();
    private final Map<String, Object> localLocks = new ConcurrentHashMap<>();

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @Value("${idempotency.enabled:true}")
    private boolean enabled;

    @Value("${idempotency.storage:auto}")
    private String storage;

    @Value("${idempotency.ttl-seconds:300}")
    private long ttlSeconds;

    @Value("${idempotency.lock-seconds:30}")
    private long lockSeconds;

    @Value("${idempotency.wait-ms:1200}")
    private long waitMs;

    public IdempotencyService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public <T> T execute(String scope, String actor, String idempotencyKey, Class<T> responseType, Supplier<T> action) {
        if (!enabled || idempotencyKey == null || idempotencyKey.isBlank()) {
            return action.get();
        }

        String normalizedScope = normalize(scope, "default");
        String normalizedActor = normalize(actor, "anonymous");
        String normalizedKey = normalize(idempotencyKey, null);
        if (normalizedKey == null || normalizedKey.isBlank()) {
            return action.get();
        }

        String cacheKey = CACHE_PREFIX + ":" + normalizedScope + ":" + normalizedActor + ":" + normalizedKey;
        if (shouldUseRedis()) {
            return executeWithRedis(cacheKey, responseType, action);
        }
        return executeWithLocalCache(cacheKey, responseType, action);
    }

    private boolean shouldUseRedis() {
        String mode = storage == null ? "auto" : storage.trim().toLowerCase(Locale.ROOT);
        if ("local".equals(mode)) {
            return false;
        }
        if (redisTemplate == null) {
            return false;
        }
        return "redis".equals(mode) || "auto".equals(mode);
    }

    private <T> T executeWithRedis(String cacheKey, Class<T> responseType, Supplier<T> action) {
        try {
            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null && !cached.isBlank()) {
                return objectMapper.readValue(cached, responseType);
            }
        } catch (Exception ex) {
            logger.debug("Idempotency redis read failed for {}: {}", cacheKey, ex.getMessage());
        }

        String lockKey = cacheKey + LOCK_SUFFIX;
        boolean lockAcquired = false;
        try {
            Boolean acquired = redisTemplate.opsForValue()
                    .setIfAbsent(lockKey, "1", Duration.ofSeconds(Math.max(3, lockSeconds)));
            lockAcquired = Boolean.TRUE.equals(acquired);
            if (!lockAcquired) {
                T waited = waitForRedisResult(cacheKey, responseType);
                if (waited != null) {
                    return waited;
                }
                // Lock holder likely failed mid-flight; proceed once to avoid deadlock.
                lockAcquired = true;
                redisTemplate.opsForValue().set(lockKey, "1", Duration.ofSeconds(Math.max(3, lockSeconds)));
            }

            T result = action.get();
            cacheRedisResult(cacheKey, result);
            return result;
        } finally {
            if (lockAcquired) {
                try {
                    redisTemplate.delete(lockKey);
                } catch (Exception ex) {
                    logger.debug("Idempotency redis lock cleanup failed for {}: {}", lockKey, ex.getMessage());
                }
            }
        }
    }

    private <T> T waitForRedisResult(String cacheKey, Class<T> responseType) {
        long deadline = System.currentTimeMillis() + Math.max(250L, waitMs);
        while (System.currentTimeMillis() < deadline) {
            try {
                String cached = redisTemplate.opsForValue().get(cacheKey);
                if (cached != null && !cached.isBlank()) {
                    return objectMapper.readValue(cached, responseType);
                }
            } catch (Exception ex) {
                logger.debug("Idempotency redis wait read failed for {}: {}", cacheKey, ex.getMessage());
                return null;
            }
            sleep(100L);
        }
        return null;
    }

    private <T> void cacheRedisResult(String cacheKey, T result) {
        try {
            String payload = objectMapper.writeValueAsString(result);
            redisTemplate.opsForValue().set(cacheKey, payload, Duration.ofSeconds(Math.max(30, ttlSeconds)));
        } catch (Exception ex) {
            logger.debug("Idempotency redis write failed for {}: {}", cacheKey, ex.getMessage());
        }
    }

    private <T> T executeWithLocalCache(String cacheKey, Class<T> responseType, Supplier<T> action) {
        evictExpiredLocalEntries();
        LocalEntry existing = localCache.get(cacheKey);
        if (existing != null && !existing.isExpired()) {
            return deserializeLocal(existing.payload, responseType, action);
        }

        Object lock = localLocks.computeIfAbsent(cacheKey, key -> new Object());
        synchronized (lock) {
            LocalEntry current = localCache.get(cacheKey);
            if (current != null && !current.isExpired()) {
                return deserializeLocal(current.payload, responseType, action);
            }
            T result = action.get();
            try {
                String payload = objectMapper.writeValueAsString(result);
                long expiresAt = System.currentTimeMillis() + Duration.ofSeconds(Math.max(30, ttlSeconds)).toMillis();
                localCache.put(cacheKey, new LocalEntry(payload, expiresAt));
            } catch (Exception ex) {
                logger.debug("Idempotency local cache write failed for {}: {}", cacheKey, ex.getMessage());
            }
            return result;
        }
    }

    private <T> T deserializeLocal(String payload, Class<T> responseType, Supplier<T> action) {
        try {
            return objectMapper.readValue(payload, responseType);
        } catch (Exception ex) {
            logger.debug("Idempotency local cache decode failed: {}", ex.getMessage());
            return action.get();
        }
    }

    private void evictExpiredLocalEntries() {
        long now = System.currentTimeMillis();
        localCache.entrySet().removeIf(entry -> entry.getValue() == null || entry.getValue().expiresAt < now);
    }

    private void sleep(long delayMs) {
        try {
            Thread.sleep(Math.max(20L, delayMs));
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
        }
    }

    private String normalize(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return fallback;
        }
        String sanitized = normalized.replaceAll("[^A-Za-z0-9_\\-:.]", "_");
        if (sanitized.length() > 128) {
            sanitized = sanitized.substring(0, 128);
        }
        return sanitized;
    }

    private static class LocalEntry {
        private final String payload;
        private final long expiresAt;

        private LocalEntry(String payload, long expiresAt) {
            this.payload = payload;
            this.expiresAt = expiresAt;
        }

        private boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }
}

