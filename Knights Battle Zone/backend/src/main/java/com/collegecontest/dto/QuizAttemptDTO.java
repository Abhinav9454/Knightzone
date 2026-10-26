package com.collegecontest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "QuizAttemptDTO", description = "Quiz attempt payload/response")
public class QuizAttemptDTO {
    private Long id;

    @NotNull
    @Schema(description = "Quiz id")
    private Long quizId;

    @Schema(description = "Quiz title")
    private String quizTitle;

    @Valid
    private List<AnswerDTO> answers;

    private Integer score;
    private Integer totalPoints;
    private LocalDateTime submittedAt;
}
