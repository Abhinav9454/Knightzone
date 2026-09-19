package com.collegecontest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "ContestDTO", description = "Contest data transfer object")
public class ContestDTO {
    private Long id;

    @NotBlank
    @Size(max = 200)
    @Schema(description = "Contest title")
    private String title;

    private String description;

    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;

    private Integer durationMinutes;

    private UserDTO createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Valid
    private List<ProblemDTO> problems;

    private Long participantCount;
}
