package com.collegecontest.contrib.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContributionTypeStatDTO {
    private String type;
    private String label;
    private Integer count;
    private Integer points;
}
