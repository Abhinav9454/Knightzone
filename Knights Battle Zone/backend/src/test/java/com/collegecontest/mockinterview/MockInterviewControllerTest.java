package com.collegecontest.mockinterview;

import com.collegecontest.mockinterview.dto.MasteryTrackProgressRequest;
import com.collegecontest.mockinterview.dto.MasteryTrackProgressResponse;
import com.collegecontest.mockinterview.dto.MasteryTrackSessionRequest;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MockInterviewControllerTest {

    @Mock
    private MockInterviewService service;

    @Mock
    private UserRepository userRepository;

    private MockInterviewController controller;

    @BeforeEach
    void setUp() {
        controller = new MockInterviewController(service, userRepository);

        User user = new User();
        user.setId(42L);
        user.setName("Tester");
        user.setEmail("tester@example.com");
        user.setRole(Role.STUDENT);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "tester@example.com",
                        "n/a",
                        List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))
                )
        );
        when(userRepository.findByEmail("tester@example.com")).thenReturn(Optional.of(user));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void masteryProgress_returnsCurrentUserProgress() {
        MasteryTrackProgressResponse progress = MasteryTrackProgressResponse.builder()
                .id(1L)
                .userId(42L)
                .trackId("dsa-accelerator")
                .trackTitle("DSA Accelerator")
                .status("ON_TRACK")
                .build();
        when(service.getMasteryTrackProgress(42L)).thenReturn(List.of(progress));

        ResponseEntity<List<MasteryTrackProgressResponse>> response = controller.masteryProgress();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("dsa-accelerator", response.getBody().get(0).getTrackId());
        verify(service).getMasteryTrackProgress(42L);
    }

    @Test
    void upsertMasteryProgress_forwardsAuthenticatedUserId() {
        MasteryTrackProgressRequest request = new MasteryTrackProgressRequest();
        request.setTrackId("dsa-accelerator");
        request.setTrackTitle("DSA Accelerator");

        MasteryTrackProgressResponse progress = MasteryTrackProgressResponse.builder()
                .id(2L)
                .userId(42L)
                .trackId("dsa-accelerator")
                .trackTitle("DSA Accelerator")
                .status("NEEDS_ATTENTION")
                .build();
        when(service.upsertMasteryTrackProgress(42L, request)).thenReturn(progress);

        ResponseEntity<MasteryTrackProgressResponse> response = controller.upsertMasteryProgress(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("dsa-accelerator", response.getBody().getTrackId());
        verify(service).upsertMasteryTrackProgress(42L, request);
    }

    @Test
    void recordMasterySession_forwardsAuthenticatedUserId() {
        MasteryTrackSessionRequest request = new MasteryTrackSessionRequest();
        request.setTrackId("dsa-accelerator");
        request.setSessionScore(87.0);

        MasteryTrackProgressResponse progress = MasteryTrackProgressResponse.builder()
                .id(3L)
                .userId(42L)
                .trackId("dsa-accelerator")
                .completedSprints(3)
                .status("ON_TRACK")
                .build();
        when(service.recordMasteryTrackSession(42L, request)).thenReturn(progress);

        ResponseEntity<MasteryTrackProgressResponse> response = controller.recordMasterySession(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(3, response.getBody().getCompletedSprints());
        verify(service).recordMasteryTrackSession(42L, request);
    }
}
