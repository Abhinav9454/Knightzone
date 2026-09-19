package com.collegecontest.duel.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DuelFairPlaySummaryDTO {
    private long totalFlagsAgainstUser;
    private long openFlagsAgainstUser;
    private long reportsSubmitted;
    private List<DuelFairPlayFlagDTO> recentFlagsAgainstUser;
}
