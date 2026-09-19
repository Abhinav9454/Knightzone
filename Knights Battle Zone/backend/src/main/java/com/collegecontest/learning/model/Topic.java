package com.collegecontest.learning.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "topics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Topic {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(length = 1000)
    private String description;

    @Column(name = "estimated_hours")
    private Integer estimatedHours;

    @Column(name = "difficulty_level")
    private Integer difficultyLevel; // 1-5

    @Column(name = "difficulty_label", length = 32)
    private String difficultyLabel; // BEGINNER | INTERMEDIATE | ADVANCED

    @Column(name = "phase", length = 64)
    private String phase; // YEAR_1_FOUNDATION, YEAR_2_CORE, ...

    @Column(name = "path_tag", length = 128)
    private String pathTag; // WEB_DEV, AI_ML, CORE_CS ...
}
