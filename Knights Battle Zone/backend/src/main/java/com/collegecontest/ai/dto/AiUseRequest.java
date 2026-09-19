package com.collegecontest.ai.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiUseRequest {

    @NotNull(message = "Prompt type is required")
    private AiPromptType type;

    @Size(max = 100_000, message = "Code payload is too large")
    private String userCode;

    @Size(max = 100, message = "Language is too long")
    private String language;

    @Size(max = 12_000, message = "Problem description is too long")
    private String problemDescription;

    @Size(max = 200, message = "Topic is too long")
    private String topic;

    @Size(max = 50, message = "Difficulty is too long")
    private String difficulty;

    @Size(max = 4_000, message = "Extra instructions are too long")
    private String extraInstructions;
}
