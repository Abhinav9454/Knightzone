package com.collegecontest.service;

import com.collegecontest.dto.AuthRequest;
import com.collegecontest.dto.AuthResponse;
import com.collegecontest.dto.BasicMessageResponse;
import com.collegecontest.dto.ForgotPasswordRequest;
import com.collegecontest.dto.ForgotPasswordResponse;
import com.collegecontest.dto.RefreshTokenRequest;
import com.collegecontest.dto.RegistrationRequest;
import com.collegecontest.dto.ResetPasswordRequest;
import com.collegecontest.dto.UserDTO;
import com.collegecontest.model.PasswordResetToken;
import com.collegecontest.model.RefreshToken;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.repository.PasswordResetTokenRepository;
import com.collegecontest.repository.RefreshTokenRepository;
import com.collegecontest.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final int PASSWORD_RESET_EXPIRY_MINUTES = 15;
    private static final String FORGOT_PASSWORD_GENERIC_MESSAGE = "If this email exists, a reset link has been generated.";
    private static final String INVALID_REFRESH_TOKEN_MESSAGE = "Invalid or expired refresh token";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserPublicIdService userPublicIdService;

    @Autowired
    private Environment environment;

    @Autowired
    private GoogleIdentityService googleIdentityService;

    public AuthResponse register(RegistrationRequest req) {
        String normalizedEmail = normalizeEmail(req.getEmail());

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email already exists"
            );
        }

        User user = new User();
        user.setName(req.getName());
        user.setUsername(generateUniqueUsername(req.getName(), normalizedEmail));
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(Role.STUDENT);
        user.setPublicUserId(userPublicIdService.generateUniquePublicUserId());

        User savedUser = userRepository.save(user);

        return buildAuthResponse(savedUser);
    }

    public AuthResponse login(AuthRequest req) {
        String normalizedEmail = normalizeEmail(req.getEmail());

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                ));
        user = revokeExpiredAdminAccessIfNeeded(user);

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        return buildAuthResponse(user);
    }

    public AuthResponse loginWithGoogle(String idToken) {
        GoogleIdentityService.GoogleProfile googleProfile = googleIdentityService.verifyIdToken(idToken);
        String normalizedEmail = normalizeEmail(googleProfile.email());

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .map(this::revokeExpiredAdminAccessIfNeeded)
                .orElseGet(() -> createGoogleUser(googleProfile, normalizedEmail));

        boolean changed = false;
        if (Boolean.FALSE.equals(user.getEmailVerified())) {
            user.setEmailVerified(true);
            changed = true;
        }
        if ((user.getAvatarUrl() == null || user.getAvatarUrl().isBlank())
                && googleProfile.pictureUrl() != null
                && !googleProfile.pictureUrl().isBlank()) {
            user.setAvatarUrl(googleProfile.pictureUrl());
            changed = true;
        }
        if ((user.getName() == null || user.getName().isBlank())
                && googleProfile.name() != null
                && !googleProfile.name().isBlank()) {
            user.setName(googleProfile.name().trim());
            changed = true;
        }
        if (changed) {
            user = userRepository.save(user);
        }

        return buildAuthResponse(user);
    }

    public AuthResponse refresh(RefreshTokenRequest req) {
        String rawRefreshToken = req.getRefreshToken().trim();
        if (rawRefreshToken.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token is required");
        }

        RefreshToken existingToken = refreshTokenRepository
                .findFirstByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(hashToken(rawRefreshToken), LocalDateTime.now())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_REFRESH_TOKEN_MESSAGE));

        User user = userRepository.findById(existingToken.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_REFRESH_TOKEN_MESSAGE));
        user = revokeExpiredAdminAccessIfNeeded(user);

        LocalDateTime now = LocalDateTime.now();
        existingToken.setLastUsedAt(now);
        existingToken.setRevokedAt(now);
        refreshTokenRepository.save(existingToken);

        return buildAuthResponse(user);
    }

    public BasicMessageResponse logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return new BasicMessageResponse("Logged out");
        }

        String normalized = rawRefreshToken.trim();
        refreshTokenRepository.findFirstByTokenHashAndRevokedAtIsNull(hashToken(normalized))
                .ifPresent(token -> {
                    token.setLastUsedAt(LocalDateTime.now());
                    token.setRevokedAt(LocalDateTime.now());
                    refreshTokenRepository.save(token);
                });

        return new BasicMessageResponse("Logged out");
    }

    public UserDTO getCurrentUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));
        user = revokeExpiredAdminAccessIfNeeded(user);

        return convertToUserDTO(user);
    }

    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest req) {
        String email = normalizeEmail(req.getEmail());
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            return new ForgotPasswordResponse(FORGOT_PASSWORD_GENERIC_MESSAGE, null);
        }

        passwordResetTokenRepository.deleteByUserId(user.getId());

        String rawToken = generateSecureToken();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUserId(user.getId());
        resetToken.setTokenHash(hashToken(rawToken));
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(PASSWORD_RESET_EXPIRY_MINUTES));
        passwordResetTokenRepository.save(resetToken);

        String tokenForClient = isProduction() ? null : rawToken;
        return new ForgotPasswordResponse(FORGOT_PASSWORD_GENERIC_MESSAGE, tokenForClient);
    }

    public BasicMessageResponse resetPassword(ResetPasswordRequest req) {
        String token = req.getToken().trim();

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findFirstByTokenHashAndUsedAtIsNullAndExpiresAtAfter(hashToken(token), LocalDateTime.now())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token"));

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);
        passwordResetTokenRepository.deleteByUserId(user.getId());
        refreshTokenRepository.deleteByUserId(user.getId());

        return new BasicMessageResponse("Password reset successful. Please login with your new password.");
    }

    private User revokeExpiredAdminAccessIfNeeded(User user) {
        if (user.getRole() == Role.ADMIN
                && user.getAdminExpiresAt() != null
                && user.getAdminExpiresAt().isBefore(LocalDateTime.now())) {
            user.setRole(Role.STUDENT);
            user.setAdminExpiresAt(null);
            return userRepository.save(user);
        }
        return user;
    }

    private UserDTO convertToUserDTO(User user) {
        boolean changed = false;
        if (user.getUsername() == null || user.getUsername().isBlank()) {
            user.setUsername(generateUniqueUsername(user.getName(), user.getEmail()));
            changed = true;
        }
        if (user.getPublicUserId() == null || user.getPublicUserId().isBlank()) {
            userPublicIdService.ensurePublicUserId(user);
            changed = true;
        }
        if (changed) {
            userRepository.save(user);
        }
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setUsername(user.getUsername());
        dto.setPublicUserId(user.getPublicUserId());
        dto.setEmail(user.getEmail());
        dto.setCollege(user.getCollege());
        dto.setDepartment(user.getDepartment());
        dto.setAdminExpiresAt(user.getAdminExpiresAt());
        dto.setRole(user.getRole().toString());
        dto.setRating(user.getRating());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setBio(user.getBio());
        dto.setPhone(user.getPhone());
        dto.setLocation(user.getLocation());
        dto.setTimezone(user.getTimezone());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setSkills(parseSkills(user.getSkillsCsv()));
        dto.setGithubUrl(user.getGithubUrl());
        dto.setLinkedinUrl(user.getLinkedinUrl());
        dto.setTwitterUrl(user.getTwitterUrl());
        dto.setPortfolioUrl(user.getPortfolioUrl());
        dto.setPrivacyEmail(user.getPrivacyEmail());
        dto.setPrivacyActivity(user.getPrivacyActivity());
        dto.setEmailNotifications(user.getEmailNotifications());
        dto.setPushNotifications(user.getPushNotifications());
        dto.setTwoFactorEnabled(user.getTwoFactorEnabled());
        dto.setEmailVerified(user.getEmailVerified());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    private User createGoogleUser(GoogleIdentityService.GoogleProfile googleProfile, String normalizedEmail) {
        User user = new User();
        String displayName = googleProfile.name();
        if (displayName == null || displayName.isBlank()) {
            displayName = normalizedEmail.split("@")[0];
        }
        user.setName(displayName.trim());
        user.setUsername(generateUniqueUsername(displayName, normalizedEmail));
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(generateSecureToken()));
        user.setRole(Role.STUDENT);
        user.setEmailVerified(true);
        user.setAvatarUrl(googleProfile.pictureUrl());
        user.setPublicUserId(userPublicIdService.generateUniquePublicUserId());
        return userRepository.save(user);
    }

    private String generateUniqueUsername(String name, String email) {
        String base = (name != null && !name.isBlank() ? name : email.split("@")[0])
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "")
                .trim();
        if (base.isBlank()) {
            base = "user";
        }
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + suffix++;
        }
        return candidate;
    }

    private List<String> parseSkills(String skillsCsv) {
        if (skillsCsv == null || skillsCsv.isBlank()) return List.of();
        return Arrays.stream(skillsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    private AuthResponse buildAuthResponse(User user) {
        cleanupExpiredRefreshTokens();

        String accessToken = jwtService.generateAccessToken(
                user.getEmail(),
                user.getRole().toString()
        );
        String refreshToken = issueRefreshToken(user.getId());

        return new AuthResponse(accessToken, refreshToken, convertToUserDTO(user));
    }

    private String issueRefreshToken(Long userId) {
        String rawRefreshToken = generateSecureToken();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(userId);
        refreshToken.setTokenHash(hashToken(rawRefreshToken));
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(Math.max(60, jwtService.getRefreshTokenExpirationMs() / 1000)));
        refreshTokenRepository.save(refreshToken);
        return rawRefreshToken;
    }

    private void cleanupExpiredRefreshTokens() {
        refreshTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }

    private String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to process token");
        }
    }

    private String normalizeEmail(String rawEmail) {
        if (rawEmail == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        String normalized = rawEmail.trim().toLowerCase(Locale.ROOT);
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        return normalized;
    }

    private boolean isProduction() {
        return environment.acceptsProfiles(Profiles.of("prod"));
    }
}
