package com.collegecontest.typing.dto;

import lombok.Data;
import java.util.List;

@Data
public class KeystrokeDTO {
    private Long userId;
    private Long submissionId;
    private List<Integer> intervals; // milliseconds between keystrokes
}
