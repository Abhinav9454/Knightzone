package com.collegecontest.placement.integration;

import com.collegecontest.dto.AuthRequest;
import com.collegecontest.dto.AuthResponse;
import com.collegecontest.dto.ContestDTO;
import com.collegecontest.dto.RegistrationRequest;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
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

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers(disabledWithoutDocker = true)
class PlacementSecurityIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.33")
            .withDatabaseName("placement_security_test_db")
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
        registry.add("jwt.secret", () -> "placement-security-test-jwt-secret-0123456789012345");
        registry.add("jwt.expiration", () -> "3600000");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldEnforceAuthAndRoleAccessForPlacementAndContestApis() {
        String base = "http://localhost:" + port;
        String email = "placement-security@example.com";
        String password = "password123";

        ResponseEntity<String> noAuthPlacementResponse =
                restTemplate.getForEntity(base + "/api/placement/jobs", String.class);
        assertThat(noAuthPlacementResponse.getStatusCode().value()).isIn(401, 403);

        String studentToken = registerAndGetToken(base, "Placement Security", email, password);
        ResponseEntity<String> placementAsStudent = restTemplate.exchange(
                base + "/api/placement/jobs",
                HttpMethod.GET,
                authEntity(studentToken, null),
                String.class
        );
        assertThat(placementAsStudent.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<String> placementDashboardAsStudent = restTemplate.exchange(
                base + "/api/placement/dashboard",
                HttpMethod.GET,
                authEntity(studentToken, null),
                String.class
        );
        assertThat(placementDashboardAsStudent.getStatusCode()).isEqualTo(HttpStatus.OK);

        ContestDTO contestPayload = buildContestPayload("Security Role Contest");
        ResponseEntity<String> contestAsStudent = restTemplate.exchange(
                base + "/api/contests",
                HttpMethod.POST,
                authEntity(studentToken, contestPayload),
                String.class
        );
        assertThat(contestAsStudent.getStatusCode().value()).isIn(401, 403);

        String adminToken = elevateToAdminAndLogin(base, email, password);
        ResponseEntity<String> contestAsAdmin = restTemplate.exchange(
                base + "/api/contests",
                HttpMethod.POST,
                authEntity(adminToken, contestPayload),
                String.class
        );
        assertThat(contestAsAdmin.getStatusCode()).isEqualTo(HttpStatus.OK);
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

    private ContestDTO buildContestPayload(String title) {
        ContestDTO dto = new ContestDTO();
        dto.setTitle(title);
        dto.setDescription("Security integration validation");
        dto.setStartTime(LocalDateTime.now().plusMinutes(15));
        dto.setEndTime(LocalDateTime.now().plusHours(2));
        return dto;
    }

    private HttpEntity<?> authEntity(String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return body == null ? new HttpEntity<>(headers) : new HttpEntity<>(body, headers);
    }
}

