package com.collegecontest.health;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
public class JudgeServiceHealthIndicator implements HealthIndicator {

    private final RestTemplate restTemplate;

    @Value("${judge.service.url}")
    private String judgeUrl;

    public JudgeServiceHealthIndicator(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public Health health() {
        try {
            String healthUrl = judgeUrl.endsWith("/") ? judgeUrl + "health" : judgeUrl + "/health";
            var resp = restTemplate.getForEntity(healthUrl, String.class);
            if (resp.getStatusCode().is2xxSuccessful()) {
                return Health.up().withDetail("judge", "reachable").build();
            }
            return Health.down().withDetail("judge", "status:" + resp.getStatusCodeValue()).build();
        } catch (RestClientException e) {
            try {
                // fallback: try root
                var resp = restTemplate.getForEntity(judgeUrl, String.class);
                if (resp.getStatusCode().is2xxSuccessful()) {
                    return Health.up().withDetail("judge", "reachable-root").build();
                }
                return Health.down(e).withDetail("judge", "fallback-status:" + resp.getStatusCodeValue()).build();
            } catch (Exception ex) {
                return Health.down(ex).withDetail("judge", "error").build();
            }
        } catch (Exception e) {
            return Health.down(e).withDetail("judge", "error").build();
        }
    }
}
