package com.collegecontest.judge.config;

import com.collegecontest.judge.controller.ExecutionController;
import com.collegecontest.judge.repo.PlagiarismReportRepository;
import com.collegecontest.judge.repo.SubmissionRepository;
import com.collegecontest.judge.repo.TestCaseRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import jakarta.persistence.EntityManagerFactory;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = ExecutionController.class,
        excludeAutoConfiguration = {
                DataSourceAutoConfiguration.class,
                HibernateJpaAutoConfiguration.class,
                JpaRepositoriesAutoConfiguration.class
        })
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "judge.auth.token=JudgeInternalTokenForTestsLongEnough123456",
        "cors.allowed-origins=http://localhost:3000",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration"
})
class SecurityConfigTokenAuthTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SubmissionRepository submissionRepository;

    @MockBean
    private TestCaseRepository testCaseRepository;

    @MockBean
    private PlagiarismReportRepository plagiarismReportRepository;

    @MockBean(name = "entityManagerFactory")
    private EntityManagerFactory entityManagerFactory;

    @Test
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk());
    }

    @Test
    void executeEndpointRejectsMissingToken() throws Exception {
        mockMvc.perform(post("/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"language\":\"python\",\"code\":\"print('hi')\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void executeEndpointAllowsValidInternalToken() throws Exception {
        mockMvc.perform(post("/execute")
                        .header("X-Judge-Token", "JudgeInternalTokenForTestsLongEnough123456")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"language\":\"python\",\"code\":\"print('hi')\"}"))
                .andExpect(status().isServiceUnavailable());
    }
}
