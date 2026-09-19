package com.collegecontest.team.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "team_members")
@IdClass(TeamMemberId.class)
@Data
public class TeamMember {
    @Id
    @Column(name = "team_id")
    private Long teamId;

    @Id
    @Column(name = "user_id")
    private Long userId;
}
