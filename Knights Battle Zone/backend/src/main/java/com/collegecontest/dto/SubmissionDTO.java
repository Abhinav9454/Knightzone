package com.collegecontest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "SubmissionDTO", description = "Code submission payload/response")
public class SubmissionDTO {
    private Long id;

    @NotNull
    @Schema(description = "Problem id")
    private Long problemId;

    @NotBlank
    @Schema(description = "Source code")
    private String code;

    @NotBlank
    @Schema(description = "Programming language")
    private String language;

    // response fields
    private String status;
    private String output;
    private String judgeSubmissionId;
    private Integer executionTime;
    private LocalDateTime submittedAt;
}
