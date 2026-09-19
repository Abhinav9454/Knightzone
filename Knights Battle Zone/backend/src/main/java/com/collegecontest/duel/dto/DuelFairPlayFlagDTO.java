package com.collegecontest.duel.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DuelFairPlayFlagDTO {
    private Long id;
    private Long duelId;
    private Long reporterUserId;
    private Long reportedUserId;
    private String flagType;
    private String severity;
    private String reason;
    private String analysisDetails;
    private String status;
    private LocalDateTime createdAt;
}
