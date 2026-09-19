package com.collegecontest.placement.integration;

import com.collegecontest.dto.AuthResponse;
import com.collegecontest.dto.AuthRequest;
import com.collegecontest.dto.RegistrationRequest;
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
import org.springframework.http.*;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers(disabledWithoutDocker = true)
class PlacementIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.33")
            .withDatabaseName("placement_test_db")
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
        registry.add("jwt.secret", () -> "placement-test-jwt-secret-012345678901234567890");
        registry.add("jwt.expiration", () -> "3600000");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldCreatePlacementJobApplyAndTrackOwnApplications() throws Exception {
        String base = "http://localhost:" + port;
        String studentEmail = "placement-owner@example.com";
        String password = "password123";
        String studentToken = registerAndGetToken(base, "Placement Owner", studentEmail, password);
        String adminToken = elevateToAdminAndLogin(base, studentEmail, password);

        Map<String, Object> createJobPayload = Map.of(
                "companyId", 101L,
                "title", "Platform Engineer Intern",
                "description", "Build internal tooling for contests.",
                "eligibilityCriteria", "CGPA >= 7.0",
                "location", "Remote",
                "salary", "8-12 LPA",
                "deadline", LocalDateTime.now().plusDays(7).toString(),
                "status", "OPEN"
        );

        ResponseEntity<String> createJobResponse = restTemplate.exchange(
                base + "/api/placement/jobs",
                HttpMethod.POST,
                entity(adminToken, createJobPayload),
                String.class
        );
        assertThat(createJobResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode createdJob = objectMapper.readTree(createJobResponse.getBody());
        long jobId = createdJob.path("id").asLong();
        assertThat(jobId).isPositive();
        assertThat(createdJob.path("title").asText()).isEqualTo("Platform Engineer Intern");

        ResponseEntity<String> listJobsResponse = restTemplate.exchange(
                base + "/api/placement/jobs",
                HttpMethod.GET,
                entity(studentToken, null),
                String.class
        );
        assertThat(listJobsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode jobs = objectMapper.readTree(listJobsResponse.getBody());
        assertThat(jobs.isArray()).isTrue();
        assertThat(jobs.size()).isGreaterThanOrEqualTo(1);

        ResponseEntity<String> applyResponse = restTemplate.exchange(
                base + "/api/placement/jobs/" + jobId + "/apply",
                HttpMethod.POST,
                entity(studentToken, Map.of("resumeUrl", "https://cdn.test/resume.pdf", "coverLetter", "I am interested")),
                String.class
        );
        assertThat(applyResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode applied = objectMapper.readTree(applyResponse.getBody());
        long applicationId = applied.path("id").asLong();
        assertThat(applicationId).isPositive();
        assertThat(applied.path("jobId").asLong()).isEqualTo(jobId);
        assertThat(applied.path("status").asText()).isEqualTo("APPLIED");

        ResponseEntity<String> duplicateApplyResponse = restTemplate.exchange(
                base + "/api/placement/jobs/" + jobId + "/apply",
                HttpMethod.POST,
                entity(studentToken, null),
                String.class
        );
        assertThat(duplicateApplyResponse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        ResponseEntity<String> updateStatusResponse = restTemplate.exchange(
                base + "/api/placement/applications/" + applicationId + "/status?status=SHORTLISTED&comments=Good%20profile",
                HttpMethod.PUT,
                entity(adminToken, null),
                String.class
        );
        assertThat(updateStatusResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode updatedApplication = objectMapper.readTree(updateStatusResponse.getBody());
        assertThat(updatedApplication.path("status").asText()).isEqualTo("SHORTLISTED");

        ResponseEntity<String> myApplicationsResponse = restTemplate.exchange(
                base + "/api/placement/applications/my",
                HttpMethod.GET,
                entity(studentToken, null),
                String.class
        );
        assertThat(myApplicationsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode myApplications = objectMapper.readTree(myApplicationsResponse.getBody());
        assertThat(myApplications.isArray()).isTrue();
        assertThat(myApplications.toString()).contains("SHORTLISTED");

        ResponseEntity<String> dashboardResponse = restTemplate.exchange(
                base + "/api/placement/dashboard",
                HttpMethod.GET,
                entity(studentToken, null),
                String.class
        );
        assertThat(dashboardResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode dashboard = objectMapper.readTree(dashboardResponse.getBody());
        assertThat(dashboard.path("myApplications").asLong()).isGreaterThanOrEqualTo(1L);
        assertThat(dashboard.path("openJobs").asLong()).isGreaterThanOrEqualTo(1L);
        assertThat(dashboard.path("totalJobs").asLong()).isGreaterThanOrEqualTo(1L);
    }

    private String registerAndGetToken(String base, String name, String email, String password) {
        RegistrationRequest request = new RegistrationRequest();
        request.setName(name);
        request.setEmail(email);
        request.setPassword(password);

        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(base + "/auth/register", request, AuthResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getToken()).isNotBlank();
        return response.getBody().getToken();
    }

    private String elevateToAdminAndLogin(String base, String email, String password) {
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setRole(Role.ADMIN);
        userRepository.save(user);

        AuthRequest request = new AuthRequest();
        request.setEmail(email);
        request.setPassword(password);

        ResponseEntity<AuthResponse> loginResponse = restTemplate.postForEntity(base + "/auth/login", request, AuthResponse.class);
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody()).isNotNull();
        assertThat(loginResponse.getBody().getToken()).isNotBlank();
        return loginResponse.getBody().getToken();
    }

    private HttpEntity<?> entity(String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return body == null ? new HttpEntity<>(headers) : new HttpEntity<>(body, headers);
    }
}
