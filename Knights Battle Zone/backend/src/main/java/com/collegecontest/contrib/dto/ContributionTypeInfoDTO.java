package com.collegecontest.contrib.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContributionTypeInfoDTO {
    private String key;
    private String label;
    private String description;
    private Integer points;
    private String hint;
    private Boolean requiresReferenceId;
}
