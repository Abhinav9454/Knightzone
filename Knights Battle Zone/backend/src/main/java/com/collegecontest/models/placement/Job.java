package com.collegecontest.models.placement;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "placement_jobs")
public class Job {
    public enum Status {
        OPEN,
        CLOSED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    private String companyName;

    @Column(nullable = false)
    private String title;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String eligibilityCriteria;

    private String location;
    private String salary;

    private LocalDateTime postedDate;
    private LocalDateTime deadline;

    @Enumerated(EnumType.STRING)
    private Status status = Status.OPEN;

    @PrePersist
    void onCreate() {
        if (postedDate == null) {
            postedDate = LocalDateTime.now();
        }
    }
}
