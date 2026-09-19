package com.collegecontest.match.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BattleMatchDTO {
    private Long battleId;
    private Long problemId;
    private Long opponentId;
    private String status;
}
