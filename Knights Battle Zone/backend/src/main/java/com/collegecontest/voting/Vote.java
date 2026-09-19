package com.collegecontest.voting;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "votes",
        uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "target_type", "target_id" }),
        indexes = {
                @Index(name = "idx_votes_target", columnList = "target_type,target_id"),
                @Index(name = "idx_votes_user", columnList = "user_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "target_type")
    private String targetType;

    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "vote_value")
    private Integer voteValue;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
