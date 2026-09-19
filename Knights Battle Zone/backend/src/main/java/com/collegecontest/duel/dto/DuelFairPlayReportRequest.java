package com.collegecontest.duel.dto;

import lombok.Data;

@Data
public class DuelFairPlayReportRequest {
    private Long duelId;
    private Long reportedUserId;
    private String reason;
}
