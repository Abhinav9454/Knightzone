package com.collegecontest.learning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TopicWeaknessDTO {
    private String topicName;
    private Double weakness;
}
