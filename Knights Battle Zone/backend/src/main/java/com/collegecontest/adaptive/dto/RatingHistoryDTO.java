package com.collegecontest.adaptive.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class RatingHistoryDTO {
    private Long id;
    private Double oldRating;
    private Double newRating;
    private Double change;
    private String reason;
    private LocalDateTime timestamp;
}
