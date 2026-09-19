package com.collegecontest.duel.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PlatformAnalyticsDTO {
    private Retention retention;
    private Engagement engagement;
    private List<PopularPassage> popularPassages;
    private List<DifficultyBucket> difficultyDistribution;

    @Data
    @Builder
    public static class Retention {
        private long dau;
        private long wau;
        private long mau;
    }

    @Data
    @Builder
    public static class Engagement {
        private long totalDuels;
        private long completedDuels;
        private long activePendingDuels;
        private double avgCompletionMinutes;
    }

    @Data
    @Builder
    public static class PopularPassage {
        private String snippet;
        private long uses;
    }

    @Data
    @Builder
    public static class DifficultyBucket {
        private String difficulty;
        private long count;
    }
}
