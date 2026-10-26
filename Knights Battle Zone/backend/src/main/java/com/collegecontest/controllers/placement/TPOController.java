package com.collegecontest.controllers.placement;

import com.collegecontest.services.placement.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/placement/tpo")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class TPOController {
    private final DashboardService dashboardService;

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return dashboardService.tpoDashboard();
    }
}
