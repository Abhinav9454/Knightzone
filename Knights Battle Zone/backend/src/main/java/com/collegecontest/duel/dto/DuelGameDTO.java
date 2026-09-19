package com.collegecontest.duel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class DuelGameDTO {
    private String slug;
    private String name;
    private String description;
    private List<String> difficultyLevels;
    private boolean active;
}
