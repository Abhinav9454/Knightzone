package com.collegecontest.typing.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TypingTestResultDTO {
    private Long id;
    private Long userId;
    private String mode;
    private Integer wpm;
    private Double accuracy;
    private Integer errors;
    private Integer durationSeconds;
    private Integer wordCountTarget;
    private String category;
    private String textSnippet;
    private LocalDateTime createdAt;
}
