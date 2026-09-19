package com.collegecontest.judge.mq;

public class JudgeResultEvent {
    private String judgeSubmissionId;
    private String status;
    private String details;
    private String stderr;
    private String stdout;
    private Double runtimeSeconds;
    private Long peakMemoryBytes;
    private Integer exitCode;

    public String getJudgeSubmissionId() {
        return judgeSubmissionId;
    }

    public void setJudgeSubmissionId(String judgeSubmissionId) {
        this.judgeSubmissionId = judgeSubmissionId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getStderr() {
        return stderr;
    }

    public void setStderr(String stderr) {
        this.stderr = stderr;
    }

    public String getStdout() {
        return stdout;
    }

    public void setStdout(String stdout) {
        this.stdout = stdout;
    }

    public Double getRuntimeSeconds() {
        return runtimeSeconds;
    }

    public void setRuntimeSeconds(Double runtimeSeconds) {
        this.runtimeSeconds = runtimeSeconds;
    }

    public Long getPeakMemoryBytes() {
        return peakMemoryBytes;
    }

    public void setPeakMemoryBytes(Long peakMemoryBytes) {
        this.peakMemoryBytes = peakMemoryBytes;
    }

    public Integer getExitCode() {
        return exitCode;
    }

    public void setExitCode(Integer exitCode) {
        this.exitCode = exitCode;
    }
}
