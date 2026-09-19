package com.collegecontest.typing.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "typing_texts")
@Data
public class TypingText {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String difficulty;

    private String source;

    @Column(nullable = false)
    private Integer usedCount = 0;

    @Column(nullable = false)
    private Boolean active = true;
}

