package com.collegecontest.config;

import com.collegecontest.controller.AuthController;
import com.collegecontest.dto.AuthResponse;
import com.collegecontest.service.AuthService;
import com.collegecontest.service.CustomUserDetailsService;
import com.collegecontest.service.JwtService;
import com.collegecontest.repository.UserRepository;
import com.collegecontest.tracker.controller.TrackerController;
import com.collegecontest.tracker.service.TrackerConnectionService;
import com.collegecontest.tracker.service.TrackerInsightService;
import com.collegecontest.tracker.service.TrackerReportService;
import com.collegecontest.tracker.service.TrackerSkillGapService;
import com.collegecontest.tracker.service.TrackerSummaryService;
import com.collegecontest.tracker.service.TrackerSyncService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {AuthController.class, TrackerController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class SecurityConfigAuthRulesTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private TrackerConnectionService trackerConnectionService;

    @MockBean
    private TrackerSyncService trackerSyncService;

    @MockBean
    private TrackerSummaryService trackerSummaryService;

    @MockBean
    private TrackerInsightService trackerInsightService;

    @MockBean
    private TrackerSkillGapService trackerSkillGapService;

    @MockBean
    private TrackerReportService trackerReportService;

    @MockBean
    private CorsOriginProperties corsOriginProperties;

    @Test
    void loginEndpointRemainsPublic() throws Exception {
        when(corsOriginProperties.asList()).thenReturn(List.of("http://localhost:3000"));
        when(authService.login(any())).thenReturn(new AuthResponse("token", "refresh", null));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"student@example.com",
                                  "password":"Pass@12345"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token"));
    }

    @Test
    void trackerEndpointRequiresAuthentication() throws Exception {
        when(corsOriginProperties.asList()).thenReturn(List.of("http://localhost:3000"));
        mockMvc.perform(get("/tracker/platforms"))
                .andExpect(status().isUnauthorized());
    }
}
