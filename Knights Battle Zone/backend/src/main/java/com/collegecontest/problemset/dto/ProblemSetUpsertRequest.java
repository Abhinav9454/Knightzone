package com.collegecontest.problemset.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProblemSetUpsertRequest {
    @NotBlank
    @Size(max = 200)
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    private String difficulty;

    @NotBlank
    private String inputFormat;

    @NotBlank
    private String outputFormat;

    @NotBlank
    private String sampleInput;

    @NotBlank
    private String sampleOutput;

    @NotBlank
    private String testCases;

    @NotNull
    @Min(50)
    @Max(1000)
    private Integer points;

    @NotNull
    @Min(1)
    @Max(10)
    private Integer timeLimitSeconds;
}

