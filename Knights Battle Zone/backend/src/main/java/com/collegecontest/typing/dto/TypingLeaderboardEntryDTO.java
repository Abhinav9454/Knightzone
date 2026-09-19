package com.collegecontest.typing.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class TypingLeaderboardEntryDTO {
    private Integer rank;
    private Long userId;
    private String username;
    private Integer bestWpm;
    private Double bestAccuracy;
    private LocalDateTime achievedAt;
}

