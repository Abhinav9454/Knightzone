package com.collegecontest.tracker.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TrackerGithubRepoDTO {
    private String repoName;
    private Integer commits;
    private Integer stars;
    private Integer forks;
    private LocalDateTime lastUpdated;
}

