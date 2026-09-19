package com.collegecontest.team.model;

import java.io.Serializable;
import lombok.Data;

@Data
public class TeamMemberId implements Serializable {
    private Long teamId;
    private Long userId;
}
