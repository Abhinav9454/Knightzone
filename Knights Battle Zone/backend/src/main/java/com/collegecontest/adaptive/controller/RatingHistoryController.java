package com.collegecontest.adaptive.controller;

import com.collegecontest.adaptive.dto.RatingHistoryDTO;
import com.collegecontest.adaptive.service.EloRatingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
public class RatingHistoryController {

    private final EloRatingService eloRatingService;

    public RatingHistoryController(EloRatingService eloRatingService) {
        this.eloRatingService = eloRatingService;
    }

    @GetMapping("/{userId}/rating-history")
    public ResponseEntity<List<RatingHistoryDTO>> getRatingHistory(@PathVariable Long userId) {
        List<RatingHistoryDTO> history = eloRatingService.getRatingHistory(userId);
        return ResponseEntity.ok(history);
    }
}
