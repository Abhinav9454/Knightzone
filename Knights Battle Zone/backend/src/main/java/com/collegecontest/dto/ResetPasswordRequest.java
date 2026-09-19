package com.collegecontest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(name = "ResetPasswordRequest", description = "Reset password payload")
public class ResetPasswordRequest {

    @NotBlank
    @Schema(description = "One-time password reset token")
    private String token;

    @NotBlank
    @Size(min = 6, max = 100)
    @Schema(description = "New password")
    private String newPassword;
}
