package com.collegecontest.judge.dto;

import lombok.Data;

@Data
public class SubmissionRequest {
    private String language; // e.g., java, python, node, c
    private String code; // source code
    private String problemId; // id of the problem whose testcases to run
    private String queueLane = "submit"; // submit, run, high
    private String stdin; // optional input
    private int timeLimitSeconds = 5; // default
    private int memoryMb = 256; // default memory limit
    private double cpus = 0.5; // default CPU limit
}
