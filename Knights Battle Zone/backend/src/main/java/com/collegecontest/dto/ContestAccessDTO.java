package com.collegecontest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContestAccessDTO {
    private Long contestId;
    private boolean registered;
    private Integer durationMinutes;
    private LocalDateTime attemptStartTime;
    private LocalDateTime attemptEndTime;
    private Long remainingSeconds;
}
