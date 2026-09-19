package com.collegecontest.marketplace.integration;

import com.collegecontest.dto.AuthResponse;
import com.collegecontest.dto.RegistrationRequest;
import com.collegecontest.marketplace.model.Passage;
import com.collegecontest.marketplace.model.PassageModeration;
import com.collegecontest.marketplace.model.PassageModerationStatus;
import com.collegecontest.marketplace.model.PassageStatus;
import com.collegecontest.marketplace.model.PassageTag;
import com.collegecontest.marketplace.repository.PassageModerationRepository;
import com.collegecontest.marketplace.repository.PassageRatingRepository;
import com.collegecontest.marketplace.repository.PassageRepository;
import com.collegecontest.marketplace.repository.PassageTagRepository;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers(disabledWithoutDocker = true)
class MarketplaceIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.33")
            .withDatabaseName("marketplace_test_db")
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
        registry.add("jwt.secret", () -> "marketplace-test-jwt-secret-012345678901234567");
        registry.add("jwt.expiration", () -> "3600000");
        registry.add("spring.redis.host", () -> "localhost");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PassageRepository passageRepository;

    @Autowired
    private PassageRatingRepository passageRatingRepository;

    @Autowired
    private PassageTagRepository passageTagRepository;

    @Autowired
    private PassageModerationRepository passageModerationRepository;

    @Test
    void shouldPreventDuplicateRatingsForSameUserAndPassage() throws Exception {
        String base = "http://localhost:" + port + "/api";
        String email = "market-user-" + System.nanoTime() + "@example.com";
        String token = registerAndGetToken(base, "Marketplace User", email);

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        Passage passage = seedApprovedPassage(user, "Rate Me Once", 40, 20, 4.2, 5, false);

        ResponseEntity<String> first = restTemplate.exchange(
                base + "/passages/" + passage.getId() + "/rate",
                HttpMethod.POST,
                entity(token, Map.of("rating", 5, "completed", true)),
                String.class
        );
        ResponseEntity<String> second = restTemplate.exchange(
                base + "/passages/" + passage.getId() + "/rate",
                HttpMethod.POST,
                entity(token, Map.of("rating", 2, "completed", true)),
                String.class
        );

        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.OK);

        assertThat(passageRatingRepository.countByPassageId(passage.getId())).isEqualTo(1);
        assertThat(passageRatingRepository.findByPassageIdAndUserId(passage.getId(), user.getId()))
                .map(r -> r.getRating())
                .contains(2);

        Passage refreshed = passageRepository.findById(passage.getId()).orElseThrow();
        assertThat(refreshed.getRatingCount()).isEqualTo(1);
        assertThat(refreshed.getAverageRating()).isEqualTo(2.0);
    }

    @Test
    void trendingEndpointShouldSupportPaginationAndStayPerformant() throws Exception {
        String base = "http://localhost:" + port + "/api";
        String email = "market-trending-" + System.nanoTime() + "@example.com";
        String token = registerAndGetToken(base, "Trending User", email);

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        for (int i = 0; i < 36; i++) {
            long plays = 220L - (i * 3L);
            long completions = Math.max(0, plays - (i * 2L));
            double avgRating = 2.6 + ((i % 5) * 0.4);
            Passage passage = seedApprovedPassage(
                    user,
                    "Trending Passage " + i,
                    Math.max(1, plays),
                    completions,
                    Math.min(5.0, avgRating),
                    8 + i,
                    i < 6
            );
            addTag(passage, i % 2 == 0 ? "code" : "interview");
        }

        long firstStartedAt = System.nanoTime();
        ResponseEntity<String> firstPageResponse = restTemplate.exchange(
                base + "/passages/trending?page=0&size=10",
                HttpMethod.GET,
                entity(token, null),
                String.class
        );
        long firstDurationMs = Duration.ofNanos(System.nanoTime() - firstStartedAt).toMillis();

        long secondStartedAt = System.nanoTime();
        ResponseEntity<String> secondPageResponse = restTemplate.exchange(
                base + "/passages/trending?page=1&size=10",
                HttpMethod.GET,
                entity(token, null),
                String.class
        );
        long secondDurationMs = Duration.ofNanos(System.nanoTime() - secondStartedAt).toMillis();

        assertThat(firstPageResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(secondPageResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode first = objectMapper.readTree(firstPageResponse.getBody());
        JsonNode second = objectMapper.readTree(secondPageResponse.getBody());

        assertThat(first.path("number").asInt()).isEqualTo(0);
        assertThat(second.path("number").asInt()).isEqualTo(1);
        assertThat(first.path("content").size()).isEqualTo(10);
        assertThat(second.path("content").size()).isEqualTo(10);
        assertThat(first.path("totalElements").asInt()).isGreaterThanOrEqualTo(36);
        assertThat(first.path("content").get(0).path("id").asLong())
                .isNotEqualTo(second.path("content").get(0).path("id").asLong());

        assertThat(firstDurationMs).isLessThan(5000L);
        assertThat(secondDurationMs).isLessThan(5000L);
    }

    @Test
    void nonAdminShouldNotAccessModerationReports() {
        String base = "http://localhost:" + port + "/api";
        String token = registerAndGetToken(base, "Normal User", "market-normal-" + System.nanoTime() + "@example.com");

        ResponseEntity<String> response = restTemplate.exchange(
                base + "/passages/moderation/reports?status=PENDING&page=0&size=10",
                HttpMethod.GET,
                entity(token, null),
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void adminCanRejectModerationReportAndPassageGetsRejected() {
        String base = "http://localhost:" + port + "/api";

        String authorEmail = "market-author-" + System.nanoTime() + "@example.com";
        String reporterEmail = "market-reporter-" + System.nanoTime() + "@example.com";
        String adminEmail = "market-admin-" + System.nanoTime() + "@example.com";

        registerAndGetToken(base, "Passage Author", authorEmail);
        String reporterToken = registerAndGetToken(base, "Passage Reporter", reporterEmail);
        String adminToken = registerAndGetToken(base, "Marketplace Admin", adminEmail);

        User author = userRepository.findByEmailIgnoreCase(authorEmail).orElseThrow();
        User adminUser = userRepository.findByEmailIgnoreCase(adminEmail).orElseThrow();
        adminUser.setRole(Role.ADMIN);
        userRepository.save(adminUser);

        Passage passage = seedApprovedPassage(author, "Flagged Passage", 15, 11, 4.0, 3, true);
        addTag(passage, "community");

        ResponseEntity<String> reportResponse = restTemplate.exchange(
                base + "/passages/" + passage.getId() + "/report",
                HttpMethod.POST,
                entity(reporterToken, Map.of("reason", "Contains incorrect guidance")),
                String.class
        );
        assertThat(reportResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        PassageModeration moderation = passageModerationRepository.findAll().stream()
                .filter(item -> item.getPassage().getId().equals(passage.getId()))
                .findFirst()
                .orElseThrow();

        ResponseEntity<String> reviewResponse = restTemplate.exchange(
                base + "/passages/moderation/" + moderation.getId() + "/review",
                HttpMethod.POST,
                entity(adminToken, Map.of(
                        "decision", "REJECT",
                        "notes", "Policy violation confirmed",
                        "featured", false
                )),
                String.class
        );

        assertThat(reviewResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode reviewJson = parseJson(reviewResponse.getBody());
        assertThat(reviewJson.path("status").asText()).isEqualTo("REJECTED");
        assertThat(reviewJson.path("reviewerName").asText()).isEqualTo("Marketplace Admin");
        assertThat(reviewJson.path("reviewNotes").asText()).isEqualTo("Policy violation confirmed");

        Passage refreshedPassage = passageRepository.findById(passage.getId()).orElseThrow();
        assertThat(refreshedPassage.getStatus()).isEqualTo(PassageStatus.REJECTED);
        assertThat(refreshedPassage.isApproved()).isFalse();
        assertThat(refreshedPassage.isFeatured()).isFalse();

        PassageModeration refreshedModeration = passageModerationRepository.findById(moderation.getId()).orElseThrow();
        assertThat(refreshedModeration.getStatus()).isEqualTo(PassageModerationStatus.REJECTED);
        assertThat(refreshedModeration.getReviewer()).isNotNull();
        assertThat(refreshedModeration.getReviewNotes()).isEqualTo("Policy violation confirmed");
        assertThat(refreshedModeration.getReviewedAt()).isNotNull();

        // Non-author non-admin should now be forbidden from opening the rejected passage.
        ResponseEntity<String> reporterOpenResponse = restTemplate.exchange(
                base + "/passages/" + passage.getId(),
                HttpMethod.GET,
                entity(reporterToken, null),
                String.class
        );
        assertThat(reporterOpenResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
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

    private Passage seedApprovedPassage(
            User author,
            String title,
            long playCount,
            long completionCount,
            double averageRating,
            long ratingCount,
            boolean featured
    ) {
        Passage passage = new Passage();
        passage.setTitle(title);
        passage.setContent("Sample content for " + title);
        passage.setPreview("Sample content for " + title);
        passage.setSyntaxMode("PLAIN");
        passage.setAuthor(author);
        passage.setFeatured(featured);
        passage.setApproved(true);
        passage.setStatus(PassageStatus.APPROVED);
        passage.setPlayCount(playCount);
        passage.setCompletionCount(completionCount);
        passage.setAverageRating(averageRating);
        passage.setRatingCount(ratingCount);
        passage.setLastPlayedAt(LocalDateTime.now().minusHours(2));
        passage.setLastRatedAt(LocalDateTime.now().minusHours(2));
        return passageRepository.save(passage);
    }

    private void addTag(Passage passage, String value) {
        PassageTag tag = new PassageTag();
        tag.setPassage(passage);
        tag.setTag(value);
        passageTagRepository.save(tag);
    }

    private HttpEntity<?> entity(String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return body == null ? new HttpEntity<>(headers) : new HttpEntity<>(body, headers);
    }

    private JsonNode parseJson(String body) {
        try {
            return objectMapper.readTree(body);
        } catch (Exception e) {
            throw new AssertionError("Unable to parse JSON response", e);
        }
    }
}
