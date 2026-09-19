package com.collegecontest.typing.dto;

import lombok.Data;

import java.util.List;

@Data
public class TypingScoreResponseDTO {
    private Boolean success;
    private Boolean newRecord;
    private Integer xpEarned;
    private Boolean levelUp;
    private List<String> badgesEarned;
    private TypingProfileDTO profile;
}

