package com.collegecontest.models.placement;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "placement_tests")
public class Test {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long jobId;
    private LocalDateTime scheduledDate;
    private Integer duration;
    private Integer totalMarks;
    private Integer passingMarks;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String instructions;
}
