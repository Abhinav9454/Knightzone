package com.collegecontest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContestFirstSolverDTO {
    private Long problemId;
    private String problemTitle;
    private Long firstSolverUserId;
    private String firstSolverName;
    private LocalDateTime firstSolvedAt;
}
