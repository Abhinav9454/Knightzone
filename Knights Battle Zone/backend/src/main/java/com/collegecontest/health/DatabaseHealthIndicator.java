package com.collegecontest.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
public class DatabaseHealthIndicator implements HealthIndicator {

    private final DataSource dataSource;

    public DatabaseHealthIndicator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Health health() {
        try (Connection conn = dataSource.getConnection()) {
            boolean valid = conn.isValid(1);
            if (valid) {
                return Health.up().withDetail("database", "reachable").build();
            } else {
                return Health.down().withDetail("database", "not-responding").build();
            }
        } catch (Exception e) {
            return Health.down(e).withDetail("database", "error").build();
        }
    }
}
