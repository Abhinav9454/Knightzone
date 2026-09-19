package com.collegecontest.integrity.team;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "team_coordination_flags")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamCoordinationFlag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contest_id")
    private Long contestId;

    @Lob
    @Column(name = "user_ids")
    private String userIdsJson; // store as JSON array of user ids

    @Column(name = "reason")
    private String reason;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
