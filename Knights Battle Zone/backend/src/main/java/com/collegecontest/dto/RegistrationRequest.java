package com.collegecontest.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(name = "RegistrationRequest", description = "User registration payload")
public class RegistrationRequest {
    @NotBlank
    @Schema(description = "Full name of the user")
    private String name;

    @Email
    @NotBlank
    @Schema(description = "Email address")
    private String email;

    @NotBlank
    @Size(min = 6)
    @Schema(description = "Password")
    private String password;
}
