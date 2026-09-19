package com.collegecontest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "ProblemDTO", description = "Problem data transfer object")
public class ProblemDTO {
    private Long id;
    private Long contestId;
    private String contestMode;

    @NotBlank
    @Size(max = 200)
    @Schema(description = "Problem title")
    private String title;

    @Schema(description = "Problem description")
    private String description;

    @NotBlank
    @Schema(description = "Difficulty level")
    private String difficulty;

    private String inputFormat;
    private String outputFormat;
    private String sampleInput;
    private String sampleOutput;
    private String testCases;

    @NotNull
    @Schema(description = "Points awarded for solving")
    private Integer points;

    @Schema(description = "Time limit in seconds")
    private Integer timeLimitSeconds;
}
