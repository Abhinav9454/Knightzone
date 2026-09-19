package com.collegecontest.adaptive.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SkillHistoryDTO {
    private Long userId;
    private Double skillLevel;
    private LocalDateTime updatedAt;
    private Long problemId;
    private Boolean solved;
}
