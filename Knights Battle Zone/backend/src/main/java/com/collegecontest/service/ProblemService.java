package com.collegecontest.service;

import com.collegecontest.exception.ResourceNotFoundException;
import com.collegecontest.model.Problem;
import com.collegecontest.dto.ProblemDTO;
import com.collegecontest.repository.ProblemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProblemService {

    @Autowired
    private ProblemRepository problemRepository;

    public ProblemDTO getProblemById(Long id) {
        Problem p = problemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Problem not found with id: " + id));
        return convertToDTO(p);
    }

    public List<ProblemDTO> getProblemsByContest(Long contestId) {
        return problemRepository.findByContestId(contestId).stream().map(this::convertToDTO).toList();
    }

    private ProblemDTO convertToDTO(Problem p) {
        ProblemDTO dto = new ProblemDTO();
        dto.setId(p.getId());
        dto.setContestId(p.getContest() != null ? p.getContest().getId() : null);
        dto.setContestMode(p.getContest() != null ? p.getContest().getMode() : null);
        dto.setTitle(p.getTitle());
        dto.setDescription(p.getDescription());
        dto.setDifficulty(p.getDifficulty());
        dto.setInputFormat(p.getInputFormat());
        dto.setOutputFormat(p.getOutputFormat());
        dto.setSampleInput(p.getSampleInput());
        dto.setSampleOutput(p.getSampleOutput());
        dto.setTestCases(p.getTestCases());
        dto.setPoints(p.getPoints());
        dto.setTimeLimitSeconds(p.getTimeLimitSeconds());
        return dto;
    }
}
