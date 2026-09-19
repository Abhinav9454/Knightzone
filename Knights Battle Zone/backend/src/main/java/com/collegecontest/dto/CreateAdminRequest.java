package com.collegecontest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(name = "CreateAdminRequest", description = "Payload for creating an admin account")
public class CreateAdminRequest {
    @NotBlank
    @Schema(description = "Full name")
    private String name;

    @Email
    @NotBlank
    @Schema(description = "Email address")
    private String email;

    @NotBlank
    @Size(min = 6)
    @Schema(description = "Password")
    private String password;

    @Schema(description = "College or organization")
    private String college;

    @Min(1)
    @Max(8760)
    @Schema(description = "Admin access validity in hours (1 to 8760)")
    private Integer accessDurationHours;
}
