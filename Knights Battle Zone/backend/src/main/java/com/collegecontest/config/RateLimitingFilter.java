package com.collegecontest.config;

import com.collegecontest.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitingFilter.class);

    private static final String OVERFLOW_BUCKET_PREFIX = "overflow:";
    private static final long CLEANUP_INTERVAL_MS = Duration.ofMinutes(1).toMillis();
    private final Map<String, BucketState> buckets = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;
    private volatile long nextCleanupAtMs = 0L;
    private Set<String> trustedProxyIps = Set.of();
    private List<CidrBlock> trustedProxyCidrs = List.of();

    @Value("${rate-limit.max-buckets:20000}")
    private int maxBuckets;

    @Value("${rate-limit.idle-bucket-ttl-minutes:30}")
    private int idleBucketTtlMinutes;

    @Value("${rate-limit.trusted-proxies:127.0.0.1,::1}")
    private String trustedProxyList;

    @Value("${rate-limit.storage:auto}")
    private String rateLimitStorage;

    @Value("${rate-limit.redis-prefix:rate-limit}")
    private String redisPrefix;

    @Value("${rate-limit.redis-window-seconds:60}")
    private long redisWindowSeconds;

    @Value("${rate-limit.auth-per-minute:20}")
    private long authPerMinute;

    @Value("${rate-limit.write-per-minute:25}")
    private long writePerMinute;

    @Value("${rate-limit.read-per-minute:600}")
    private long readPerMinute;

    // Configurable limits: stricter for auth, moderate for write, permissive for
    // read. Read limit is intentionally higher to avoid false 429s from
    // real-time dashboard polling across feature pages.
    private Bandwidth authLimit;
    private Bandwidth writeLimit;
    private Bandwidth readLimit;

    public RateLimitingFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void initializeTrustedProxyIps() {
        Set<String> ipSet = new HashSet<>();
        List<CidrBlock> cidrs = new ArrayList<>();
        Arrays.stream(trustedProxyList.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .forEach(value -> {
                    if (value.contains("/")) {
                        CidrBlock parsed = CidrBlock.parse(value);
                        if (parsed != null) {
                            cidrs.add(parsed);
                        } else {
                            logger.warn("Ignoring invalid trusted proxy CIDR: {}", value);
                        }
                    } else {
                        ipSet.add(value);
                    }
                });
        trustedProxyIps = ipSet;
        trustedProxyCidrs = cidrs;
        authLimit = Bandwidth.simple(Math.max(1, authPerMinute), Duration.ofMinutes(1));
        writeLimit = Bandwidth.simple(Math.max(1, writePerMinute), Duration.ofMinutes(1));
        readLimit = Bandwidth.simple(Math.max(1, readPerMinute), Duration.ofMinutes(1));
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Determine key: prefer authenticated user, otherwise use IP
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String key;
        boolean isAuthenticated = auth != null && auth.isAuthenticated()
                && !(auth instanceof AnonymousAuthenticationToken);
        if (isAuthenticated) {
            key = "user:" + auth.getName();
        } else {
            String ip = resolveClientIp(request);
            key = "ip:" + (ip == null ? "unknown" : ip);
        }

        // Determine bucket type by path and method
        String path = request.getRequestURI();
        String method = request.getMethod();
        String bucketType = "read";
        Bandwidth selectedLimit = readLimit;

        if (path.startsWith("/auth") || path.startsWith("/api/auth") || path.startsWith("/login")
                || path.startsWith("/register")) {
            bucketType = "auth";
            selectedLimit = authLimit;
        } else if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method)) {
            bucketType = "write";
            selectedLimit = writeLimit;
        }

        String bucketKey = key + ":" + bucketType;
        long limitPerWindow = resolvePerMinuteLimit(bucketType);
        RateLimitDecision decision = tryConsume(bucketType, bucketKey, selectedLimit, limitPerWindow);
        if (!decision.allowed) {
            String correlationId = resolveCorrelationId(request);
            String requestId = resolveRequestId(request, correlationId);

            ErrorResponse payload = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(HttpStatus.TOO_MANY_REQUESTS.value())
                    .error(HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase())
                    .code("RATE_LIMIT_EXCEEDED")
                    .message("Too many requests. Retry after " + decision.retryAfterSec + " seconds.")
                    .path(request.getRequestURI())
                    .correlationId(correlationId)
                    .build();

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(decision.retryAfterSec));
            response.setHeader("X-Request-Id", requestId);
            response.setHeader("X-Correlation-Id", correlationId);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(objectMapper.writeValueAsString(payload));
            logger.debug("Rate limit exceeded for key={} type={}", key, bucketType);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private RateLimitDecision tryConsume(String bucketType, String bucketKey, Bandwidth selectedLimit,
            long limitPerWindow) {
        if (shouldUseRedisRateLimit()) {
            RateLimitDecision redisDecision = tryConsumeViaRedis(bucketType, bucketKey, limitPerWindow);
            if (redisDecision != null) {
                return redisDecision;
            }
        }
        return tryConsumeViaLocalBucket(bucketKey, selectedLimit, bucketType);
    }

    private boolean shouldUseRedisRateLimit() {
        String storage = rateLimitStorage == null ? "auto" : rateLimitStorage.trim().toLowerCase(Locale.ROOT);
        if ("local".equals(storage)) {
            return false;
        }
        if (redisTemplate == null) {
            return false;
        }
        return "redis".equals(storage) || "auto".equals(storage);
    }

    private RateLimitDecision tryConsumeViaRedis(String bucketType, String bucketKey, long limitPerWindow) {
        long windowSeconds = Math.max(10, redisWindowSeconds);
        long nowSeconds = System.currentTimeMillis() / 1000L;
        long windowId = nowSeconds / windowSeconds;
        String redisKey = String.format("%s:%s:%s:%d",
                redisPrefix,
                bucketType,
                bucketKey.replace(' ', '_'),
                windowId);

        try {
            Long used = redisTemplate.opsForValue().increment(redisKey);
            if (used == null) {
                return null;
            }
            if (used == 1L) {
                redisTemplate.expire(redisKey, Duration.ofSeconds(windowSeconds * 2));
            }
            boolean allowed = used <= limitPerWindow;
            long retryAfterSec = Math.max(1, windowSeconds - (nowSeconds % windowSeconds));
            return new RateLimitDecision(allowed, retryAfterSec);
        } catch (Exception ex) {
            logger.debug("Redis rate limit fallback to local bucket due to error: {}", ex.getMessage());
            return null;
        }
    }

    private RateLimitDecision tryConsumeViaLocalBucket(String bucketKey, Bandwidth limit, String bucketType) {
        long now = System.currentTimeMillis();
        cleanupIfRequired(now);
        Bucket bucket = getOrCreateBucket(bucketKey, limit, bucketType, now);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            return new RateLimitDecision(true, 0);
        }
        long waitForRefillNanos = probe.getNanosToWaitForRefill();
        long retryAfterSec = Math.max(1, Duration.ofNanos(waitForRefillNanos).getSeconds());
        return new RateLimitDecision(false, retryAfterSec);
    }

    private long resolvePerMinuteLimit(String bucketType) {
        return switch (bucketType) {
            case "auth" -> Math.max(1, authPerMinute);
            case "write" -> Math.max(1, writePerMinute);
            default -> Math.max(1, readPerMinute);
        };
    }

    private Bucket getOrCreateBucket(String bucketKey, Bandwidth limit, String bucketType, long now) {
        BucketState current = buckets.get(bucketKey);
        if (current == null) {
            if (buckets.size() >= Math.max(1000, maxBuckets)) {
                cleanupStaleBuckets(now);
            }
            if (buckets.size() >= Math.max(1000, maxBuckets)) {
                bucketKey = OVERFLOW_BUCKET_PREFIX + bucketType;
            }
            current = buckets.computeIfAbsent(bucketKey, key ->
                    new BucketState(Bucket.builder().addLimit(limit).build(), now));
        }
        current.touch(now);
        return current.bucket;
    }

    private void cleanupIfRequired(long now) {
        if (now < nextCleanupAtMs) {
            return;
        }
        nextCleanupAtMs = now + CLEANUP_INTERVAL_MS;
        cleanupStaleBuckets(now);
    }

    private void cleanupStaleBuckets(long now) {
        long idleThresholdMs = Math.max(5, idleBucketTtlMinutes) * 60_000L;
        buckets.entrySet().removeIf(entry ->
                now - entry.getValue().lastAccessedAtMs > idleThresholdMs);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr == null || remoteAddr.isBlank()) {
            return "unknown";
        }

        if (!isTrustedProxy(remoteAddr)) {
            return remoteAddr;
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String[] forwardedIps = forwardedFor.split(",");
            if (forwardedIps.length > 0) {
                String candidate = forwardedIps[0].trim();
                if (!candidate.isBlank()) {
                    return candidate;
                }
            }
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return remoteAddr;
    }

    private boolean isTrustedProxy(String remoteAddr) {
        if (trustedProxyIps.contains(remoteAddr)) {
            return true;
        }
        if (trustedProxyCidrs.isEmpty()) {
            return false;
        }
        try {
            InetAddress remoteIp = InetAddress.getByName(remoteAddr);
            for (CidrBlock cidrBlock : trustedProxyCidrs) {
                if (cidrBlock.contains(remoteIp)) {
                    return true;
                }
            }
        } catch (UnknownHostException exception) {
            logger.debug("Unable to parse remote address for trusted proxy check: {}", remoteAddr);
        }
        return false;
    }

    private String resolveCorrelationId(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Correlation-Id");
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = request.getHeader("X-Request-Id");
        }
        if (correlationId == null || correlationId.isBlank()) {
            String fromMdc = MDC.get("correlationId");
            if (fromMdc != null && !fromMdc.isBlank()) {
                correlationId = fromMdc;
            }
        }
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        return correlationId;
    }

    private String resolveRequestId(HttpServletRequest request, String fallback) {
        String requestId = request.getHeader("X-Request-Id");
        if (requestId == null || requestId.isBlank()) {
            String fromMdc = MDC.get("requestId");
            if (fromMdc != null && !fromMdc.isBlank()) {
                return fromMdc;
            }
            return fallback;
        }
        return requestId;
    }

    private static final class BucketState {
        private final Bucket bucket;
        private volatile long lastAccessedAtMs;

        private BucketState(Bucket bucket, long lastAccessedAtMs) {
            this.bucket = bucket;
            this.lastAccessedAtMs = lastAccessedAtMs;
        }

        private void touch(long timestampMs) {
            this.lastAccessedAtMs = timestampMs;
        }
    }

    private static final class RateLimitDecision {
        private final boolean allowed;
        private final long retryAfterSec;

        private RateLimitDecision(boolean allowed, long retryAfterSec) {
            this.allowed = allowed;
            this.retryAfterSec = retryAfterSec;
        }
    }

    private static final class CidrBlock {
        private final byte[] networkAddress;
        private final int prefixBits;

        private CidrBlock(byte[] networkAddress, int prefixBits) {
            this.networkAddress = networkAddress;
            this.prefixBits = prefixBits;
        }

        private static CidrBlock parse(String cidr) {
            try {
                String[] parts = cidr.split("/");
                if (parts.length != 2) {
                    return null;
                }
                InetAddress baseAddress = InetAddress.getByName(parts[0].trim());
                int prefix = Integer.parseInt(parts[1].trim());
                int totalBits = baseAddress.getAddress().length * 8;
                if (prefix < 0 || prefix > totalBits) {
                    return null;
                }
                return new CidrBlock(baseAddress.getAddress(), prefix);
            } catch (Exception exception) {
                return null;
            }
        }

        private boolean contains(InetAddress ip) {
            byte[] candidate = ip.getAddress();
            if (candidate.length != networkAddress.length) {
                return false;
            }

            int fullBytes = prefixBits / 8;
            int remainderBits = prefixBits % 8;

            for (int index = 0; index < fullBytes; index++) {
                if (candidate[index] != networkAddress[index]) {
                    return false;
                }
            }

            if (remainderBits == 0) {
                return true;
            }

            int mask = (0xFF << (8 - remainderBits)) & 0xFF;
            return (candidate[fullBytes] & mask) == (networkAddress[fullBytes] & mask);
        }
    }
}
