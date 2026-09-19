package com.collegecontest.tracker.service;

import com.collegecontest.tracker.dto.ConnectPlatformRequest;
import com.collegecontest.tracker.dto.PlatformConnectionDTO;
import com.collegecontest.tracker.model.TrackerPlatform;
import com.collegecontest.tracker.model.UserPlatformConnection;
import com.collegecontest.tracker.repository.UserPlatformConnectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class TrackerConnectionService {
    private static final Set<TrackerPlatform> SUPPORTED_PLATFORMS = EnumSet.of(
            TrackerPlatform.LEETCODE,
            TrackerPlatform.CODEFORCES,
            TrackerPlatform.GITHUB);

    private final UserPlatformConnectionRepository connectionRepository;
    private final TrackerTokenCryptoService tokenCryptoService;

    public TrackerConnectionService(
            UserPlatformConnectionRepository connectionRepository,
            TrackerTokenCryptoService tokenCryptoService) {
        this.connectionRepository = connectionRepository;
        this.tokenCryptoService = tokenCryptoService;
    }

    public PlatformConnectionDTO upsertConnection(Long userId, ConnectPlatformRequest request) {
        TrackerPlatform platform;
        try {
            platform = TrackerPlatform.from(request.getPlatform());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported platform");
        }

        if (!SUPPORTED_PLATFORMS.contains(platform)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Platform is currently unsupported");
        }

        String username = request.getUsername() == null ? "" : request.getUsername().trim();
        if (username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        }

        UserPlatformConnection connection = connectionRepository.findByUserIdAndPlatform(userId, platform)
                .orElseGet(UserPlatformConnection::new);
        connection.setUserId(userId);
        connection.setPlatform(platform);
        connection.setUsername(username);

        if (request.getAccessToken() != null && !request.getAccessToken().isBlank()) {
            connection.setAccessToken(tokenCryptoService.encrypt(request.getAccessToken().trim()));
        }

        return toDto(connectionRepository.save(connection));
    }

    @Transactional(readOnly = true)
    public List<PlatformConnectionDTO> getConnections(Long userId) {
        return connectionRepository.findByUserId(userId).stream()
                .filter(connection -> SUPPORTED_PLATFORMS.contains(connection.getPlatform()))
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserPlatformConnection getConnectionOrThrow(Long userId, TrackerPlatform platform) {
        return connectionRepository.findByUserIdAndPlatform(userId, platform)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Platform account is not connected"));
    }

    private PlatformConnectionDTO toDto(UserPlatformConnection connection) {
        return PlatformConnectionDTO.builder()
                .id(connection.getId())
                .platform(connection.getPlatform().name())
                .username(connection.getUsername())
                .lastFetchedAt(connection.getLastFetched())
                .connectedAt(connection.getCreatedAt())
                .build();
    }
}
