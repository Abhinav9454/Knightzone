package com.collegecontest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "OptionDTO", description = "Option for a question")
public class OptionDTO {
    private Long id;

    @NotBlank
    @Schema(description = "Option text")
    private String text;

    @Schema(description = "Whether the option is correct; hidden for students")
    private Boolean isCorrect;
}
