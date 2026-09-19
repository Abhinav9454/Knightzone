package com.collegecontest.models.placement;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "placement_applications")
public class Application {
    public enum Status {
        APPLIED,
        SHORTLISTED,
        REJECTED,
        SELECTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long jobId;
    private Long studentId;

    @Enumerated(EnumType.STRING)
    private Status status = Status.APPLIED;

    private LocalDateTime appliedDate;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String comments;

    @PrePersist
    void onCreate() {
        if (appliedDate == null) {
            appliedDate = LocalDateTime.now();
        }
    }
}
