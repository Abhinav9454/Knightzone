package com.collegecontest.ranking;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "shadow_rankings", uniqueConstraints = @UniqueConstraint(columnNames = { "contest_id", "user_id" }))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShadowRanking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contest_id", nullable = false)
    private Long contestId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "shadow_rank")
    private Integer shadowRank;

    @Column(name = "metric_value")
    private Double metricValue;

    @Column(name = "computed_at")
    private LocalDateTime computedAt;
}
