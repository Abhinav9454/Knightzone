package com.collegecontest.placement;

import com.collegecontest.placement.dto.PlacementReadinessDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users/{userId}/placement-readiness")
public class PlacementReadinessController {

    private final PlacementReadinessService service;

    public PlacementReadinessController(PlacementReadinessService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<PlacementReadinessDTO> get(@PathVariable Long userId, @RequestParam Long companyId) {
        PlacementReadinessDTO dto = service.getReadiness(userId, companyId);
        return ResponseEntity.ok(dto);
    }
}
