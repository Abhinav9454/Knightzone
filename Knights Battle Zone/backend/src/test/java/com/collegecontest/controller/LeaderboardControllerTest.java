package com.collegecontest.controller;

import com.collegecontest.config.JwtAuthenticationFilter;
import com.collegecontest.dto.LeaderboardFilterParams;
import com.collegecontest.dto.LeaderboardPageResponse;
import com.collegecontest.dto.LeaderboardTimeRange;
import com.collegecontest.service.LeaderboardService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LeaderboardController.class)
@AutoConfigureMockMvc(addFilters = false)
class LeaderboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LeaderboardService leaderboardService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void getGlobalLeaderboard_shouldApplyDefaultsAndReturnMetadata() throws Exception {
        when(leaderboardService.getGlobalLeaderboard(any(), anyInt(), anyInt()))
                .thenReturn(LeaderboardPageResponse.builder()
                        .content(List.of())
                        .total(0)
                        .page(0)
                        .size(20)
                        .appliedFilters(Map.of("timeRange", "all-time"))
                        .build());

        mockMvc.perform(get("/leaderboard").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.appliedFilters.timeRange").value("all-time"));

        ArgumentCaptor<LeaderboardFilterParams> filtersCaptor = ArgumentCaptor.forClass(LeaderboardFilterParams.class);
        verify(leaderboardService).getGlobalLeaderboard(filtersCaptor.capture(), anyInt(), anyInt());
        LeaderboardFilterParams captured = filtersCaptor.getValue();

        assertThat(captured.getTimeRange()).isEqualTo(LeaderboardTimeRange.ALL_TIME);
        assertThat(captured.getCountry()).isNull();
        assertThat(captured.getDifficulty()).isNull();
    }

    @Test
    void getGlobalLeaderboard_shouldMapAdvancedFilterParams() throws Exception {
        when(leaderboardService.getGlobalLeaderboard(any(), anyInt(), anyInt()))
                .thenReturn(LeaderboardPageResponse.builder()
                        .content(List.of())
                        .total(14)
                        .page(1)
                        .size(10)
                        .appliedFilters(Map.of(
                                "country", "India",
                                "timeRange", "week"))
                        .build());

        mockMvc.perform(get("/leaderboard")
                        .param("region", "South")
                        .param("country", "India")
                        .param("college", "NIT")
                        .param("department", "CSE")
                        .param("mode", "SPEED")
                        .param("difficulty", "HARD")
                        .param("timeRange", "week")
                        .param("page", "1")
                        .param("size", "10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(14))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.appliedFilters.country").value("India"))
                .andExpect(jsonPath("$.appliedFilters.timeRange").value("week"));

        ArgumentCaptor<LeaderboardFilterParams> filtersCaptor = ArgumentCaptor.forClass(LeaderboardFilterParams.class);
        ArgumentCaptor<Integer> pageCaptor = ArgumentCaptor.forClass(Integer.class);
        ArgumentCaptor<Integer> sizeCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(leaderboardService).getGlobalLeaderboard(filtersCaptor.capture(), pageCaptor.capture(), sizeCaptor.capture());

        LeaderboardFilterParams captured = filtersCaptor.getValue();
        assertThat(captured.getRegion()).isEqualTo("South");
        assertThat(captured.getCountry()).isEqualTo("India");
        assertThat(captured.getCollege()).isEqualTo("NIT");
        assertThat(captured.getDepartment()).isEqualTo("CSE");
        assertThat(captured.getMode()).isEqualTo("SPEED");
        assertThat(captured.getDifficulty()).isEqualTo("HARD");
        assertThat(captured.getTimeRange()).isEqualTo(LeaderboardTimeRange.WEEK);
        assertThat(pageCaptor.getValue()).isEqualTo(1);
        assertThat(sizeCaptor.getValue()).isEqualTo(10);
    }
}
