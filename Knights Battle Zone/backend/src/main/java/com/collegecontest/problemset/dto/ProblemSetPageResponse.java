package com.collegecontest.problemset.dto;

import com.collegecontest.dto.ProblemDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProblemSetPageResponse {
    private List<ProblemDTO> content;
    private long totalElements;
    private int totalPages;
    private int page;
    private int size;
    private String difficulty;
    private String query;
}

