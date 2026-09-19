package com.collegecontest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "QuestionDTO", description = "Question data transfer object")
public class QuestionDTO {
    private Long id;

    @NotBlank
    @Schema(description = "Question text")
    private String text;

    @NotNull
    @Schema(description = "Points for the question")
    private Integer points;

    @Valid
    private List<OptionDTO> options;
}
