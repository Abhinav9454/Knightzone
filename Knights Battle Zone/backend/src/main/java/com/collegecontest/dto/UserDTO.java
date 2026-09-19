package com.collegecontest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "UserDTO", description = "User data returned to clients")
public class UserDTO {
    private Long id;
    private String name;
    private String username;
    private String publicUserId;
    private String email;
    private String college;
    private String department;
    private LocalDateTime adminExpiresAt;
    private String role;
    private Integer rating;
    private String avatarUrl;
    private String bio;
    private String phone;
    private String location;
    private String timezone;
    private LocalDateTime dateOfBirth;
    private List<String> skills;
    private String githubUrl;
    private String linkedinUrl;
    private String twitterUrl;
    private String portfolioUrl;
    private String privacyEmail;
    private String privacyActivity;
    private Boolean emailNotifications;
    private Boolean pushNotifications;
    private Boolean twoFactorEnabled;
    private Boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
