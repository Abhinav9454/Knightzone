package com.collegecontest.adaptive.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "rating_history")
@Data
public class RatingHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "old_rating", nullable = false)
    private Double oldRating;

    @Column(name = "new_rating", nullable = false)
    private Double newRating;

    @Column(name = "`change`", nullable = false)
    private Double change;

    @Column(name = "reason", nullable = false)
    private String reason;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
}
