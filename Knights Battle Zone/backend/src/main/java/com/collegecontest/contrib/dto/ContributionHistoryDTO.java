package com.collegecontest.contrib.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContributionHistoryDTO {
    private Long id;
    private String type;
    private String label;
    private Long referenceId;
    private Integer points;
    private LocalDateTime createdAt;
}
