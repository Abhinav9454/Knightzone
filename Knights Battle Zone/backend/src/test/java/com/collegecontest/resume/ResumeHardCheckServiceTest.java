package com.collegecontest.resume;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ResumeHardCheckServiceTest {

    private final ResumeHardCheckService service = new ResumeHardCheckService();

    @Test
    void evaluateDetailed_returnsStrongResultForWellStructuredResume() {
        String resumeText = """
                Rahul Verma
                rahul.verma@example.com
                +91 9876543210
                linkedin.com/in/rahulverma github.com/rahulverma
                Summary
                Software Engineer with strong backend ownership.
                Experience
                Software Engineer 2022 2023 2024
                Built payment microservice and improved throughput by 38%.
                Designed caching strategy that reduced latency by 42%.
                Implemented CI pipeline and reduced incidents by 31%.
                Optimized SQL queries and improved p95 by 27%.
                Projects
                Developed analytics dashboard for 12000 users.
                Skills
                Java Python React Spring Docker Kubernetes Redis MySQL AWS Git Linux REST
                Education
                """;

        ResumeHardCheckService.ResumeHardCheckResult result =
                service.evaluateDetailed(resumeText, "Rahul_Verma_Resume.pdf", 48_000L);

        long passCount = result.checks().stream().filter(item -> "PASS".equals(item.status())).count();

        assertTrue(result.deepAnalysis());
        assertTrue(passCount >= 4);
        assertTrue(result.scoreDelta() > -50);
    }

    @Test
    void evaluateDetailed_flagsWeakResumeWithNegativeDelta() {
        String weakResume = "resume final copy. did project. worked on code.";

        ResumeHardCheckService.ResumeHardCheckResult result =
                service.evaluateDetailed(weakResume, "resume-final-copy.pdf", 2_500L);

        boolean hasFail = result.checks().stream().anyMatch(item -> "FAIL".equals(item.status()));

        assertTrue(hasFail);
        assertTrue(result.scoreDelta() < 0);
        assertFalse(result.priorityActions().isEmpty());
    }

    @Test
    void evaluateFileOnly_marksDeepValidationAsLimited() {
        ResumeHardCheckService.ResumeHardCheckResult result =
                service.evaluateFileOnly("candidate_resume.pdf", 26_000L, "Parser unavailable");

        boolean hasParserDepthWarning = result.checks().stream()
                .anyMatch(item -> "parser-depth".equals(item.id()) && "WARN".equals(item.status()));

        assertFalse(result.deepAnalysis());
        assertTrue(hasParserDepthWarning);
    }
}
