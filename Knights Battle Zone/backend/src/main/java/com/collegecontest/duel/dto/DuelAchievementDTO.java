package com.collegecontest.duel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DuelAchievementDTO {
    private String code;
    private String name;
    private String description;
    private boolean earned;
}
