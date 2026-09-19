package com.collegecontest.bonus.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "submission_bonus")
@Data
public class SubmissionBonus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "contest_id")
    private Long contestId;

    @Column(name = "bonus_amount", nullable = false)
    private Double bonusAmount;

    @Column(name = "reason", nullable = false)
    private String reason;
}
