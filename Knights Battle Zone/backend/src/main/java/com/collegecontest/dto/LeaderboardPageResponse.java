package com.collegecontest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardPageResponse {
    private List<LeaderboardEntry> content;
    private long total;
    private int page;
    private int size;
    private Map<String, String> appliedFilters;
}
