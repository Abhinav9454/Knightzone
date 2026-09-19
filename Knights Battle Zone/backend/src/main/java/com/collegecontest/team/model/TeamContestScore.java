package com.collegecontest.team.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "team_contest_scores")
@Data
public class TeamContestScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "contest_id", nullable = false)
    private Long contestId;

    @Column(name = "total_score", nullable = false)
    private Double totalScore = 0.0;

    @Column(name = "bonus_awarded", nullable = false)
    private Double bonusAwarded = 0.0;
}
