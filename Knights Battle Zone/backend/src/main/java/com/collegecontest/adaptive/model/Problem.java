package com.collegecontest.adaptive.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity(name = "AdaptiveProblem")
@Table(name = "adaptive_problems")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Problem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private Double difficulty;

    @Column(nullable = false)
    private String category;

    @Column(name = "time_limit")
    private Integer timeLimit;

    @Column(name = "memory_limit")
    private Integer memoryLimit;

    @Column(name = "sample_input")
    private String sampleInput;

    @Column(name = "sample_output")
    private String sampleOutput;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;
}
