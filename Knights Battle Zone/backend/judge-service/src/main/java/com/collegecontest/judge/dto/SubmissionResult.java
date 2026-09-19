package com.collegecontest.judge.dto;

import lombok.Data;

@Data
public class SubmissionResult {
    private String stdout;
    private String stderr;
    private int exitCode;
    private String status; // ACCEPTED, TIME_LIMIT, RUNTIME_ERROR, COMPILE_ERROR
    private double runtimeSeconds;
    private long peakMemoryBytes;
}
