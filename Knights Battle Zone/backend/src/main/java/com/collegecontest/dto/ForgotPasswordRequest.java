package com.collegecontest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(name = "ForgotPasswordRequest", description = "Forgot password request payload")
public class ForgotPasswordRequest {

    @Email
    @NotBlank
    @Schema(description = "User email")
    private String email;
}
