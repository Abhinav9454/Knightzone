package com.collegecontest.resume;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeStrengthDTO {
    private Integer score;
    private List<String> suggestions;
}
