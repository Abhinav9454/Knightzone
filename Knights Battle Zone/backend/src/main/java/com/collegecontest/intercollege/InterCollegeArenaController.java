package com.collegecontest.intercollege;

import com.collegecontest.intercollege.dto.CollegeRankingDTO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/inter-college")
public class InterCollegeArenaController {

    private final InterCollegeArenaService service;
    private final CollegeRepository collegeRepository;

    public InterCollegeArenaController(InterCollegeArenaService service, CollegeRepository collegeRepository) {
        this.service = service;
        this.collegeRepository = collegeRepository;
    }

    @GetMapping("/rankings/current")
    public List<CollegeRankingDTO> getCurrentRankings() {
        return service.getCurrentMonthRankings().stream()
                .map(this::toDto)
                .toList();
    }

    @GetMapping("/colleges")
    public List<College> getColleges() {
        return collegeRepository.findAll();
    }

    private CollegeRankingDTO toDto(CollegeRanking row) {
        String name = collegeRepository.findById(row.getCollegeId())
                .map(College::getName)
                .orElse("College #" + row.getCollegeId());
        return new CollegeRankingDTO(
                name,
                row.getTotalScore() == null ? 0.0 : row.getTotalScore(),
                0,
                0,
                row.getRank() == null ? 0 : row.getRank());
    }
}
