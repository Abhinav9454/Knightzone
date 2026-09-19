package com.collegecontest.contrib.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContributorDTO {
    private Long userId;
    private String username;
    private Integer totalPoints;
    private Integer contributionsCount;
    private LocalDateTime lastContributionAt;
}
