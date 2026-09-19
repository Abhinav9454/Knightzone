package com.collegecontest.intercollege;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "college_rankings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollegeRanking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "college_id")
    private Long collegeId;

    private LocalDate month;

    @Column(name = "total_score")
    private Double totalScore;

    @Column(name = "`rank`")
    private Integer rank;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
}
