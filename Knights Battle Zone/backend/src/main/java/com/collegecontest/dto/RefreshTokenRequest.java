package com.collegecontest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(name = "RefreshTokenRequest", description = "Refresh token payload")
public class RefreshTokenRequest {

    @NotBlank
    @Schema(description = "Refresh token")
    private String refreshToken;
}
