package com.collegecontest.models.placement;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "placement_resumes")
public class Resume {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long studentId;
    private String resumeUrl;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String parsedDataJson;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void markUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
