package com.collegecontest.behavior.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorCount {
    private String errorType;
    private Long count;
    private Double percentage; // optional: percentage of non-accepted errors
}
