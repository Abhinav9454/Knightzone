package com.collegecontest.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;

@Component
public class RedisHealthIndicator implements HealthIndicator {

    private final RedisConnectionFactory redisConnectionFactory;

    public RedisHealthIndicator(RedisConnectionFactory redisConnectionFactory) {
        this.redisConnectionFactory = redisConnectionFactory;
    }

    @Override
    public Health health() {
        try (RedisConnection conn = redisConnectionFactory.getConnection()) {
            String pong = null;
            try {
                pong = conn.ping();
            } catch (Exception e) {
                // some drivers return null or throw; handle below
            }
            if (pong != null && (pong.equalsIgnoreCase("PONG") || pong.equalsIgnoreCase("+PONG"))) {
                return Health.up().withDetail("redis", "reachable").build();
            } else {
                return Health.down().withDetail("redis", "no-ping").build();
            }
        } catch (Exception e) {
            return Health.down(e).withDetail("redis", "error").build();
        }
    }
}
