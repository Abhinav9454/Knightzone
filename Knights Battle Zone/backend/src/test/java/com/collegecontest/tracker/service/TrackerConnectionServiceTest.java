package com.collegecontest.tracker.service;

import com.collegecontest.tracker.dto.ConnectPlatformRequest;
import com.collegecontest.tracker.dto.PlatformConnectionDTO;
import com.collegecontest.tracker.model.TrackerPlatform;
import com.collegecontest.tracker.model.UserPlatformConnection;
import com.collegecontest.tracker.repository.UserPlatformConnectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrackerConnectionServiceTest {

    @Mock
    private UserPlatformConnectionRepository connectionRepository;

    @Mock
    private TrackerTokenCryptoService tokenCryptoService;

    @InjectMocks
    private TrackerConnectionService trackerConnectionService;

    @Captor
    private ArgumentCaptor<UserPlatformConnection> connectionCaptor;

    private ConnectPlatformRequest request;

    @BeforeEach
    void setUp() {
        request = new ConnectPlatformRequest();
        request.setPlatform("LEETCODE");
        request.setUsername("alice");
    }

    @Test
    void upsertConnectionRejectsUnsupportedPlatform() {
        request.setPlatform("HACKERRANK");

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> trackerConnectionService.upsertConnection(1L, request));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verify(connectionRepository, never()).save(any());
    }

    @Test
    void upsertConnectionPersistsSupportedPlatform() {
        when(connectionRepository.findByUserIdAndPlatform(1L, TrackerPlatform.LEETCODE)).thenReturn(Optional.empty());
        when(connectionRepository.save(any(UserPlatformConnection.class))).thenAnswer(invocation -> {
            UserPlatformConnection saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        PlatformConnectionDTO response = trackerConnectionService.upsertConnection(1L, request);

        verify(connectionRepository).save(connectionCaptor.capture());
        UserPlatformConnection saved = connectionCaptor.getValue();
        assertEquals(1L, saved.getUserId());
        assertEquals(TrackerPlatform.LEETCODE, saved.getPlatform());
        assertEquals("alice", saved.getUsername());
        assertEquals("LEETCODE", response.getPlatform());
        assertEquals("alice", response.getUsername());
    }
}

