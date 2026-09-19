package com.collegecontest.tracker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConnectPlatformRequest {
    @NotBlank(message = "Platform is required")
    private String platform;

    @NotBlank(message = "Username is required")
    private String username;

    private String accessToken;
}

