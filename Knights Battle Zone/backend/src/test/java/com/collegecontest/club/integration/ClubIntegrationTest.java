package com.collegecontest.club.integration;

import com.collegecontest.dto.AuthResponse;
import com.collegecontest.dto.RegistrationRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers(disabledWithoutDocker = true)
class ClubIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.33")
            .withDatabaseName("club_test_db")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.datasource.driver-class-name", mysql::getDriverClassName);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "update");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.MySQLDialect");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.MySQLDialect");
        registry.add("jwt.secret", () -> "club-test-jwt-secret-012345678901234567890");
        registry.add("jwt.expiration", () -> "3600000");
        registry.add("spring.redis.host", () -> "localhost");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldEnforceMembershipPermissionAndProduceChallengeRanking() throws Exception {
        String base = "http://localhost:" + port + "/api";

        String ownerToken = registerAndGetToken(base, "Owner One", "owner-club@example.com");
        String memberToken = registerAndGetToken(base, "Member One", "member-club@example.com");

        Long clubId = createClub(base, ownerToken);

        // Non-member cannot create challenge (membership/moderator required)
        HttpEntity<?> unauthorizedChallengeRequest = entity(memberToken, Map.of(
                "title", "Weekly Sprint",
                "description", "Fast and accurate typing",
                "frequency", "WEEKLY",
                "startsAt", "2026-03-04T10:00:00",
                "endsAt", "2026-03-11T10:00:00"
        ));
        ResponseEntity<String> forbiddenResponse = restTemplate.exchange(
                base + "/clubs/" + clubId + "/challenges",
                HttpMethod.POST,
                unauthorizedChallengeRequest,
                String.class
        );
        assertThat(forbiddenResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // Member joins club
        ResponseEntity<String> joinResponse = restTemplate.exchange(
                base + "/clubs/" + clubId + "/join",
                HttpMethod.POST,
                entity(memberToken, null),
                String.class
        );
        assertThat(joinResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Owner creates challenge
        HttpEntity<?> challengeRequest = entity(ownerToken, Map.of(
                "title", "Weekly Sprint",
                "description", "Fast and accurate typing",
                "frequency", "WEEKLY",
                "startsAt", "2026-03-04T10:00:00",
                "endsAt", "2026-03-11T10:00:00"
        ));
        ResponseEntity<String> challengeResponse = restTemplate.exchange(
                base + "/clubs/" + clubId + "/challenges",
                HttpMethod.POST,
                challengeRequest,
                String.class
        );
        assertThat(challengeResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        JsonNode challengeNode = objectMapper.readTree(challengeResponse.getBody());
        Long challengeId = challengeNode.path("id").asLong();
        assertThat(challengeId).isNotNull();

        // Owner submits attempt
        ResponseEntity<String> ownerAttempt = restTemplate.exchange(
                base + "/clubs/" + clubId + "/challenges/" + challengeId + "/attempts",
                HttpMethod.POST,
                entity(ownerToken, Map.of("wpm", 80, "accuracy", 100)),
                String.class
        );
        assertThat(ownerAttempt.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Member submits stronger attempt
        ResponseEntity<String> memberAttempt = restTemplate.exchange(
                base + "/clubs/" + clubId + "/challenges/" + challengeId + "/attempts",
                HttpMethod.POST,
                entity(memberToken, Map.of("wpm", 100, "accuracy", 95)),
                String.class
        );
        assertThat(memberAttempt.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Rankings sorted by totalPoints desc
        ResponseEntity<String> rankingsResponse = restTemplate.exchange(
                base + "/clubs/" + clubId + "/rankings",
                HttpMethod.GET,
                entity(ownerToken, null),
                String.class
        );
        assertThat(rankingsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode rankings = objectMapper.readTree(rankingsResponse.getBody());
        assertThat(rankings.isArray()).isTrue();
        assertThat(rankings.size()).isGreaterThanOrEqualTo(2);
        assertThat(rankings.get(0).path("totalPoints").asDouble()).isGreaterThanOrEqualTo(rankings.get(1).path("totalPoints").asDouble());
    }

    private String registerAndGetToken(String base, String name, String email) {
        RegistrationRequest request = new RegistrationRequest();
        request.setName(name);
        request.setEmail(email);
        request.setPassword("password123");

        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(base + "/auth/register", request, AuthResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getToken()).isNotBlank();
        return response.getBody().getToken();
    }

    private Long createClub(String base, String token) throws Exception {
        ResponseEntity<String> response = restTemplate.exchange(
                base + "/clubs",
                HttpMethod.POST,
                entity(token, Map.of(
                        "name", "Velocity Club",
                        "description", "Typing enthusiasts",
                        "visibility", "PUBLIC"
                )),
                String.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode node = objectMapper.readTree(response.getBody());
        return node.path("id").asLong();
    }

    private HttpEntity<?> entity(String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return body == null ? new HttpEntity<>(headers) : new HttpEntity<>(body, headers);
    }
}
