package com.collegecontest.marketplace.dto;

public record RatePassageResponse(
        long passageId,
        int rating,
        double averageRating,
        long ratingCount
) {
}

