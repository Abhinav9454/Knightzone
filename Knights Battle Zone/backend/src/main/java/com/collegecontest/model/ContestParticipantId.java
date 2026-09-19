package com.collegecontest.model;

import java.io.Serializable;
import lombok.Data;

@Data
public class ContestParticipantId implements Serializable {
    private Long contestId;
    private Long userId;
}
