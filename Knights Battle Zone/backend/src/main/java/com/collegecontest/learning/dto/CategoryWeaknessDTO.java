package com.collegecontest.learning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CategoryWeaknessDTO {
    private String category;
    private List<TopicWeaknessDTO> topics;
}
