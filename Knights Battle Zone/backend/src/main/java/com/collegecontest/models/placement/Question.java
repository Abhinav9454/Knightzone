package com.collegecontest.models.placement;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity(name = "PlacementQuestion")
@Table(name = "placement_questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long testId;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String questionText;

    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctOption;
    private Integer marks;
}
