package com.collegecontest.integrity.lateburst;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "late_burst_flags")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LateBurstFlag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contest_id")
    private Long contestId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "recent_count")
    private Integer recentCount;

    @Column(name = "earlier_average")
    private Double earlierAverage;

    @Column(name = "factor")
    private Double factor;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
