package com.collegecontest.adaptive.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProblemDTO {
    private Long id;
    private String title;
    private Double difficulty;
    private String category;
    private Integer timeLimit;
    private Integer memoryLimit;
}
