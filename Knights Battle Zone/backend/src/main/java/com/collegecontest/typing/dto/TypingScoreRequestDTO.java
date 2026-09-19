package com.collegecontest.typing.dto;

import lombok.Data;

import java.util.Map;

@Data
public class TypingScoreRequestDTO {
    private String mode;
    private Integer wpm;
    private Integer rawWpm;
    private Double accuracy;
    private Integer testDuration;
    private Integer wordCountTarget;
    private String category;
    private String textSnippet;
    private Long textId;
    private Integer errors;
    private Integer keyPresses;
    private Map<String, Integer> keyMistakes;
}
