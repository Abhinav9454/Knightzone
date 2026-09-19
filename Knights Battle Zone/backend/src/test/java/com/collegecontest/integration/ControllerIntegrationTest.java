package com.collegecontest.integration;

import com.collegecontest.dto.AuthResponse;
import com.collegecontest.dto.RegistrationRequest;
import com.collegecontest.dto.ContestDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
public class ControllerIntegrationTest {

    @Container
    public static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.33")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.datasource.driver-class-name", mysql::getDriverClassName);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "update");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.MySQLDialect");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.MySQLDialect");
        registry.add("jwt.secret", () -> "test-test-test-test-test-test-test-test-0123456789");
        registry.add("jwt.expiration", () -> "3600000");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void authRegister_then_createAndListContest_flow() throws Exception {
        String base = "http://localhost:" + port;

        RegistrationRequest reg = new RegistrationRequest();
        reg.setName("Integration User");
        reg.setEmail("intuser@example.com");
        reg.setPassword("password123");

        ResponseEntity<AuthResponse> regResp = restTemplate.postForEntity(base + "/auth/register", reg,
                AuthResponse.class);
        assertThat(regResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(regResp.getBody()).isNotNull();

        String token = regResp.getBody().getToken();
        assertThat(token).isNotBlank();

        // Create contest
        ContestDTO contest = new ContestDTO();
        contest.setTitle("Integration Contest");
        contest.setDescription("desc");
        contest.setStartTime(LocalDateTime.now());
        contest.setEndTime(LocalDateTime.now().plusHours(1));

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<ContestDTO> req = new HttpEntity<>(contest, headers);

        ResponseEntity<String> createResp = restTemplate.exchange(base + "/api/contests", HttpMethod.POST, req,
                String.class);
        assertThat(createResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // List contests with pagination
        HttpEntity<Void> listReq = new HttpEntity<>(headers);
        ResponseEntity<String> listResp = restTemplate.exchange(base + "/api/contests?page=0&size=10", HttpMethod.GET,
                listReq, String.class);
        assertThat(listResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode tree = objectMapper.readTree(listResp.getBody());
        assertThat(tree.path("totalElements").asInt()).isGreaterThanOrEqualTo(1);
        assertThat(tree.path("content").isArray()).isTrue();
        boolean found = false;
        for (JsonNode n : tree.path("content")) {
            if (n.path("title").asText().equals("Integration Contest")) {
                found = true;
            }
        }
        assertThat(found).isTrue();
    }
}
