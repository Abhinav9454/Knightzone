package com.collegecontest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "AnswerDTO", description = "Answer selection for a question")
public class AnswerDTO {
    @NotNull
    @Schema(description = "Question id")
    private Long questionId;

    @Schema(description = "Selected option id")
    private Long selectedOption;
}
