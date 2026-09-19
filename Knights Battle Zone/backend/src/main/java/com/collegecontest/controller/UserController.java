package com.collegecontest.controller;

import com.collegecontest.dto.UserDTO;
import com.collegecontest.duel.dto.DuelLeaderboardEntryDTO;
import com.collegecontest.duel.service.DuelService;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import com.collegecontest.service.UserPublicIdService;
import com.collegecontest.util.UploadValidationUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
public class UserController {

    private static final long MAX_AVATAR_SIZE_BYTES = 2L * 1024 * 1024;
    private static final Set<String> ALLOWED_AVATAR_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp");

    private final UserRepository userRepository;
    private final DuelService duelService;
    private final PasswordEncoder passwordEncoder;
    private final UserPublicIdService userPublicIdService;

    public UserController(
            UserRepository userRepository,
            DuelService duelService,
            PasswordEncoder passwordEncoder,
            UserPublicIdService userPublicIdService) {
        this.userRepository = userRepository;
        this.duelService = duelService;
        this.passwordEncoder = passwordEncoder;
        this.userPublicIdService = userPublicIdService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<UserDTO> getAllUsers() {
        ensureAuthenticated();
        return userRepository.findAll().stream().map(this::toUserDto).toList();
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("isAuthenticated()")
    public UserDTO getPublicProfileById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toPublicProfileDto(user);
    }

    @GetMapping("/profile/{username}")
    public UserDTO getPublicProfileByUsername(@PathVariable String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toPublicProfileDto(user);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserDTO getMyProfile() {
        User user = currentUser();
        return toUserDto(user);
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public UserDTO updateProfile(@RequestBody UpdateProfileRequest request) {
        User user = currentUser();

        if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
            user.setName(request.getDisplayName().trim());
        }
        if (request.getBio() != null) user.setBio(blankToNull(request.getBio()));
        if (request.getCollege() != null) user.setCollege(blankToNull(request.getCollege()));
        if (request.getDepartment() != null) user.setDepartment(blankToNull(request.getDepartment()));
        if (request.getPhone() != null) user.setPhone(blankToNull(request.getPhone()));
        if (request.getLocation() != null) user.setLocation(blankToNull(request.getLocation()));
        if (request.getTimezone() != null) user.setTimezone(blankToNull(request.getTimezone()));
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        if (request.getGithubUrl() != null) user.setGithubUrl(blankToNull(request.getGithubUrl()));
        if (request.getLinkedinUrl() != null) user.setLinkedinUrl(blankToNull(request.getLinkedinUrl()));
        if (request.getTwitterUrl() != null) user.setTwitterUrl(blankToNull(request.getTwitterUrl()));
        if (request.getPortfolioUrl() != null) user.setPortfolioUrl(blankToNull(request.getPortfolioUrl()));
        if (request.getSkills() != null) {
            String csv = request.getSkills().stream()
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .distinct()
                    .collect(Collectors.joining(","));
            user.setSkillsCsv(csv.isBlank() ? null : csv);
        }

        User saved = userRepository.save(user);
        return toUserDto(saved);
    }

    @PostMapping("/avatar")
    @PreAuthorize("isAuthenticated()")
    public UserDTO uploadAvatar(@RequestParam("file") MultipartFile file) {
        User user = currentUser();
        UploadValidationUtils.requireNonEmpty(file, "Avatar file is required");
        UploadValidationUtils.requireMaxSize(file, MAX_AVATAR_SIZE_BYTES, "Avatar file must be <= 2MB");
        UploadValidationUtils.requireAllowedContentType(
                file,
                ALLOWED_AVATAR_CONTENT_TYPES,
                "Only JPG, PNG, GIF or WEBP images are allowed");

        String contentType = UploadValidationUtils.normalizedContentType(file.getContentType());
        try {
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());
            user.setAvatarUrl("data:" + contentType + ";base64," + base64);
            return toUserDto(userRepository.save(user));
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avatar payload is too large. Use a smaller image.");
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to process avatar");
        }
    }

    @DeleteMapping("/avatar")
    @PreAuthorize("isAuthenticated()")
    public UserDTO removeAvatar() {
        User user = currentUser();
        user.setAvatarUrl(null);
        return toUserDto(userRepository.save(user));
    }

    @GetMapping("/settings")
    @PreAuthorize("isAuthenticated()")
    public UserSettingsResponse getSettings() {
        User user = currentUser();
        return new UserSettingsResponse(
                user.getPrivacyEmail(),
                user.getPrivacyActivity(),
                Boolean.TRUE.equals(user.getEmailNotifications()),
                Boolean.TRUE.equals(user.getPushNotifications()),
                Boolean.TRUE.equals(user.getTwoFactorEnabled()),
                Boolean.TRUE.equals(user.getEmailVerified()));
    }

    @PutMapping("/settings")
    @PreAuthorize("isAuthenticated()")
    public UserSettingsResponse updateSettings(@RequestBody UpdateSettingsRequest request) {
        User user = currentUser();
        if (request.getPrivacyEmail() != null) user.setPrivacyEmail(normalizePrivacy(request.getPrivacyEmail()));
        if (request.getPrivacyActivity() != null) user.setPrivacyActivity(normalizePrivacy(request.getPrivacyActivity()));
        if (request.getEmailNotifications() != null) user.setEmailNotifications(request.getEmailNotifications());
        if (request.getPushNotifications() != null) user.setPushNotifications(request.getPushNotifications());
        if (request.getTwoFactorEnabled() != null) user.setTwoFactorEnabled(request.getTwoFactorEnabled());
        User saved = userRepository.save(user);
        return new UserSettingsResponse(
                saved.getPrivacyEmail(),
                saved.getPrivacyActivity(),
                Boolean.TRUE.equals(saved.getEmailNotifications()),
                Boolean.TRUE.equals(saved.getPushNotifications()),
                Boolean.TRUE.equals(saved.getTwoFactorEnabled()),
                Boolean.TRUE.equals(saved.getEmailVerified()));
    }

    @PutMapping("/password")
    @PreAuthorize("isAuthenticated()")
    public void changePassword(@RequestBody ChangePasswordRequest request) {
        User user = currentUser();
        if (request.getCurrentPassword() == null || request.getNewPassword() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both current and new password are required");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is invalid");
        }
        if (request.getNewPassword().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 6 characters");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @DeleteMapping("/account")
    @PreAuthorize("isAuthenticated()")
    public void deleteAccount(@RequestBody DeleteAccountRequest request) {
        User user = currentUser();
        if (request == null || request.getConfirmText() == null || !"DELETE".equalsIgnoreCase(request.getConfirmText().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Confirmation text must be DELETE");
        }
        userRepository.deleteById(user.getId());
    }

    @GetMapping("/activity")
    @PreAuthorize("isAuthenticated()")
    public List<String> getActivity() {
        User user = currentUser();
        return List.of(
                "Profile updated at " + user.getUpdatedAt(),
                "Account created at " + user.getCreatedAt(),
                "Recent participation synced from contests");
    }

    @GetMapping("/achievements")
    @PreAuthorize("isAuthenticated()")
    public List<String> getAchievements() {
        User user = currentUser();
        int rating = user.getRating() == null ? 0 : user.getRating();
        return List.of(
                "Profile Complete",
                rating >= 1200 ? "Rising Competitor" : "Starter",
                Boolean.TRUE.equals(user.getEmailVerified()) ? "Verified Account" : "Email Pending");
    }

    @GetMapping("/leaderboard")
    @PreAuthorize("isAuthenticated()")
    public List<DuelLeaderboardEntryDTO> getLeaderboard(
            @RequestParam(defaultValue = "all") String game,
            @RequestParam(defaultValue = "10") int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return duelService.getLeaderboard(game, safeLimit);
    }

    @GetMapping("/peers")
    @PreAuthorize("isAuthenticated()")
    public List<UserDTO> getPeers() {
        Long me = currentUserIdOrNull();
        return userRepository.findAll().stream()
                .filter(user -> me == null || !user.getId().equals(me))
                .map(this::toPublicProfileDto)
                .toList();
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public UserDTO updateUserRole(@PathVariable Long id, @RequestBody UpdateRoleRequest request) {
        if (request == null || request.getRole() == null || request.getRole().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role is required");
        }
        User actingUser = currentUser();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Role targetRole;
        try {
            targetRole = Role.valueOf(request.getRole().trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role");
        }

        boolean actingIsSuperAdmin = actingUser.getRole() == Role.SUPER_ADMIN;
        boolean targetIsPrivileged = targetRole == Role.ADMIN || targetRole == Role.SUPER_ADMIN;
        boolean currentIsPrivileged = user.getRole() == Role.ADMIN || user.getRole() == Role.SUPER_ADMIN;

        if (!actingIsSuperAdmin && (targetIsPrivileged || currentIsPrivileged)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only super admin can manage admin roles");
        }

        user.setRole(targetRole);
        return toUserDto(userRepository.save(user));
    }

    private User currentUser() {
        Authentication authentication = ensureAuthenticated();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Authentication ensureAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return authentication;
    }

    private UserDTO toPublicProfileDto(User user) {
        UserDTO dto = toUserDto(user);
        dto.setEmail(null);
        dto.setPhone(null);
        dto.setPrivacyEmail(null);
        dto.setEmailNotifications(null);
        dto.setPushNotifications(null);
        dto.setTwoFactorEnabled(null);
        return dto;
    }

    private UserDTO toUserDto(User user) {
        if (user.getPublicUserId() == null || user.getPublicUserId().isBlank()) {
            userPublicIdService.ensurePublicUserId(user);
            user = userRepository.save(user);
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
        dto.setRole(user.getRole() != null ? user.getRole().toString() : null);
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

    private List<String> parseSkills(String skillsCsv) {
        if (skillsCsv == null || skillsCsv.isBlank()) return List.of();
        return Arrays.stream(skillsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }

    private Long currentUserIdOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            return null;
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).map(User::getId).orElse(null);
    }

    private String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizePrivacy(String value) {
        String v = value == null ? "private" : value.trim().toLowerCase();
        if (!List.of("public", "loggedin", "private").contains(v)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid privacy value");
        }
        return v;
    }

    public static class UpdateProfileRequest {
        private String displayName;
        private String bio;
        private String college;
        private String department;
        private String phone;
        private String location;
        private String timezone;
        private LocalDateTime dateOfBirth;
        private List<String> skills;
        private String githubUrl;
        private String linkedinUrl;
        private String twitterUrl;
        private String portfolioUrl;

        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
        public String getBio() { return bio; }
        public void setBio(String bio) { this.bio = bio; }
        public String getCollege() { return college; }
        public void setCollege(String college) { this.college = college; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public String getTimezone() { return timezone; }
        public void setTimezone(String timezone) { this.timezone = timezone; }
        public LocalDateTime getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(LocalDateTime dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        public List<String> getSkills() { return skills; }
        public void setSkills(List<String> skills) { this.skills = skills; }
        public String getGithubUrl() { return githubUrl; }
        public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }
        public String getLinkedinUrl() { return linkedinUrl; }
        public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }
        public String getTwitterUrl() { return twitterUrl; }
        public void setTwitterUrl(String twitterUrl) { this.twitterUrl = twitterUrl; }
        public String getPortfolioUrl() { return portfolioUrl; }
        public void setPortfolioUrl(String portfolioUrl) { this.portfolioUrl = portfolioUrl; }
    }

    public static class UpdateSettingsRequest {
        private String privacyEmail;
        private String privacyActivity;
        private Boolean emailNotifications;
        private Boolean pushNotifications;
        private Boolean twoFactorEnabled;

        public String getPrivacyEmail() { return privacyEmail; }
        public void setPrivacyEmail(String privacyEmail) { this.privacyEmail = privacyEmail; }
        public String getPrivacyActivity() { return privacyActivity; }
        public void setPrivacyActivity(String privacyActivity) { this.privacyActivity = privacyActivity; }
        public Boolean getEmailNotifications() { return emailNotifications; }
        public void setEmailNotifications(Boolean emailNotifications) { this.emailNotifications = emailNotifications; }
        public Boolean getPushNotifications() { return pushNotifications; }
        public void setPushNotifications(Boolean pushNotifications) { this.pushNotifications = pushNotifications; }
        public Boolean getTwoFactorEnabled() { return twoFactorEnabled; }
        public void setTwoFactorEnabled(Boolean twoFactorEnabled) { this.twoFactorEnabled = twoFactorEnabled; }
    }

    public static class UserSettingsResponse {
        private String privacyEmail;
        private String privacyActivity;
        private boolean emailNotifications;
        private boolean pushNotifications;
        private boolean twoFactorEnabled;
        private boolean emailVerified;

        public UserSettingsResponse(String privacyEmail, String privacyActivity, boolean emailNotifications,
                boolean pushNotifications, boolean twoFactorEnabled, boolean emailVerified) {
            this.privacyEmail = privacyEmail;
            this.privacyActivity = privacyActivity;
            this.emailNotifications = emailNotifications;
            this.pushNotifications = pushNotifications;
            this.twoFactorEnabled = twoFactorEnabled;
            this.emailVerified = emailVerified;
        }

        public String getPrivacyEmail() { return privacyEmail; }
        public String getPrivacyActivity() { return privacyActivity; }
        public boolean isEmailNotifications() { return emailNotifications; }
        public boolean isPushNotifications() { return pushNotifications; }
        public boolean isTwoFactorEnabled() { return twoFactorEnabled; }
        public boolean isEmailVerified() { return emailVerified; }
    }

    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;
        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    public static class DeleteAccountRequest {
        private String confirmText;
        public String getConfirmText() { return confirmText; }
        public void setConfirmText(String confirmText) { this.confirmText = confirmText; }
    }

    public static class UpdateRoleRequest {
        private String role;
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }
}
