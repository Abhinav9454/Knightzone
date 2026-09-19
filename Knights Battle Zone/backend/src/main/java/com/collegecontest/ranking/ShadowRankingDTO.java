package com.collegecontest.ranking;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShadowRankingDTO {
    private Long userId;
    private Integer shadowRank;
    private Double metricValue;
    private String username;
}
