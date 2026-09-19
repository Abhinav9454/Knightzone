package com.collegecontest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(name = "AuthRequest", description = "Login request payload")
public class AuthRequest {
    @Email
    @NotBlank
    @Schema(description = "User email")
    private String email;

    @NotBlank
    @Size(min = 6)
    @Schema(description = "User password")
    private String password;
}
