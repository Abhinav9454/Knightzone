package com.collegecontest.judge.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "plagiarism_reports")
public class PlagiarismReport {
    @Id
    @GeneratedValue
    private Long id;

    private Long problemId;
    private String submissionA;
    private String submissionB;
    private double similarity;
    private boolean flagged;
    private Instant createdAt;

    public PlagiarismReport() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProblemId() {
        return problemId;
    }

    public void setProblemId(Long problemId) {
        this.problemId = problemId;
    }

    public String getSubmissionA() {
        return submissionA;
    }

    public void setSubmissionA(String submissionA) {
        this.submissionA = submissionA;
    }

    public String getSubmissionB() {
        return submissionB;
    }

    public void setSubmissionB(String submissionB) {
        this.submissionB = submissionB;
    }

    public double getSimilarity() {
        return similarity;
    }

    public void setSimilarity(double similarity) {
        this.similarity = similarity;
    }

    public boolean isFlagged() {
        return flagged;
    }

    public void setFlagged(boolean flagged) {
        this.flagged = flagged;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
