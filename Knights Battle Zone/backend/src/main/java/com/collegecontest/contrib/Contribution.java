package com.collegecontest.contrib;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "contributions",
        indexes = {
                @Index(name = "idx_contrib_user", columnList = "user_id"),
                @Index(name = "idx_contrib_user_created", columnList = "user_id,created_at")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contribution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    private String type;

    @Column(name = "reference_id")
    private Long referenceId;

    private Integer points;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
