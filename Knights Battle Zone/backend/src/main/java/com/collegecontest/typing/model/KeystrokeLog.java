package com.collegecontest.typing.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "keystroke_logs")
@Data
public class KeystrokeLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(columnDefinition = "LONGTEXT")
    private String intervals;

    @Column(name = "average_speed")
    private Double averageSpeed;

    private Double variance;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
