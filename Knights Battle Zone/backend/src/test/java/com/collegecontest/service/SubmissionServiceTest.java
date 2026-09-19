package com.collegecontest.service;

import com.collegecontest.dto.SubmissionDTO;
import com.collegecontest.judge.events.JudgeResultEvent;
import com.collegecontest.model.Contest;
import com.collegecontest.model.Problem;
import com.collegecontest.model.Submission;
import com.collegecontest.model.User;
import com.collegecontest.repository.ContestParticipantRepository;
import com.collegecontest.repository.ContestRepository;
import com.collegecontest.repository.ProblemRepository;
import com.collegecontest.repository.SubmissionRepository;
import com.collegecontest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private ProblemRepository problemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ContestRepository contestRepository;

    @Mock
    private ContestParticipantRepository contestParticipantRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private SubmissionService submissionService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(submissionService, "judgeAuthToken", "test-judge-token");
    }

    @Test
    void submitCode_marksAcceptedWhenJudgeOutputMatchesSample() {
        User user = buildUser(1L, "u@e.com");
        Problem problem = buildProblem(2L, "in", "out");

        when(userRepository.findByEmail("u@e.com")).thenReturn(Optional.of(user));
        when(problemRepository.findById(2L)).thenReturn(Optional.of(problem));
        when(submissionRepository.save(any(Submission.class))).thenAnswer(invocation -> {
            Submission submission = invocation.getArgument(0);
            if (submission.getId() == null) {
                submission.setId(123L);
            }
            return submission;
        });

        Map<String, Object> judgeResponse = new HashMap<>();
        judgeResponse.put("output", "out");
        judgeResponse.put("error", null);
        judgeResponse.put("executionTime", 9);
        when(restTemplate.exchange(
                contains("/execute"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(Map.class)))
                .thenReturn(ResponseEntity.ok(judgeResponse));

        SubmissionDTO request = new SubmissionDTO();
        request.setProblemId(2L);
        request.setCode("print('out')");
        request.setLanguage("python");

        SubmissionDTO response = submissionService.submitCode(request, "u@e.com");

        assertNotNull(response);
        assertEquals("ACCEPTED", response.getStatus());
        assertEquals(123L, response.getId());
    }

    @Test
    void submitCode_queuesSubmissionWhenJudgeIsUnavailable() {
        User user = buildUser(2L, "queue@e.com");
        Problem problem = buildProblem(3L, "input", "output");

        when(userRepository.findByEmail("queue@e.com")).thenReturn(Optional.of(user));
        when(problemRepository.findById(3L)).thenReturn(Optional.of(problem));
        when(submissionRepository.save(any(Submission.class))).thenAnswer(invocation -> {
            Submission submission = invocation.getArgument(0);
            if (submission.getId() == null) {
                submission.setId(222L);
            }
            return submission;
        });

        when(restTemplate.exchange(
                contains("/execute"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(Map.class)))
                .thenThrow(new RestClientException("judge down"));

        SubmissionDTO request = new SubmissionDTO();
        request.setProblemId(3L);
        request.setCode("code");
        request.setLanguage("java");

        SubmissionDTO response = submissionService.submitCode(request, "queue@e.com");

        assertEquals("QUEUED", response.getStatus());
        assertTrue(response.getOutput().toLowerCase().contains("queued"));
        assertEquals(222L, response.getId());
    }

    @Test
    void runCode_prefersLegacyFastPathEvenWhenAsyncEnabled() {
        User user = buildUser(5L, "run@e.com");
        Problem problem = buildProblem(7L, "hello", "hello");

        when(userRepository.findByEmail("run@e.com")).thenReturn(Optional.of(user));
        when(problemRepository.findById(7L)).thenReturn(Optional.of(problem));

        ReflectionTestUtils.setField(submissionService, "judgeAsyncEnabled", true);
        ReflectionTestUtils.setField(submissionService, "judgeRunPreferLegacy", true);
        ReflectionTestUtils.setField(submissionService, "judgeRunMaxAttempts", 1);

        Map<String, Object> judgeResponse = new HashMap<>();
        judgeResponse.put("output", "hello");
        judgeResponse.put("error", null);
        judgeResponse.put("executionTime", 4);
        when(restTemplate.exchange(
                contains("/execute"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(Map.class)))
                .thenReturn(ResponseEntity.ok(judgeResponse));

        SubmissionDTO request = new SubmissionDTO();
        request.setProblemId(7L);
        request.setCode("print('hello')");
        request.setLanguage("python");

        SubmissionDTO response = submissionService.runCode(request, "run@e.com");

        assertEquals("ACCEPTED", response.getStatus());
        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(restTemplate).exchange(urlCaptor.capture(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class));
        assertTrue(urlCaptor.getValue().contains("/execute"));
        verify(restTemplate, never()).exchange(contains("/judge/submit"), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class));
    }

    @Test
    void runCode_skipsContestTimerChecksForProblemSetMode() {
        User user = buildUser(8L, "practice@e.com");
        Problem problem = buildProblem(11L, "alpha", "alpha");
        Contest contest = new Contest();
        contest.setId(91L);
        contest.setTitle("Coding Core Problem Set (100)");
        contest.setMode("PROBLEM_SET");
        problem.setContest(contest);

        when(userRepository.findByEmail("practice@e.com")).thenReturn(Optional.of(user));
        when(problemRepository.findById(11L)).thenReturn(Optional.of(problem));

        Map<String, Object> judgeResponse = new HashMap<>();
        judgeResponse.put("output", "alpha");
        judgeResponse.put("error", null);
        judgeResponse.put("executionTime", 3);
        when(restTemplate.exchange(
                contains("/execute"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(Map.class)))
                .thenReturn(ResponseEntity.ok(judgeResponse));

        SubmissionDTO request = new SubmissionDTO();
        request.setProblemId(11L);
        request.setCode("print('alpha')");
        request.setLanguage("python");

        SubmissionDTO response = submissionService.runCode(request, "practice@e.com");

        assertEquals("ACCEPTED", response.getStatus());
        verifyNoInteractions(contestParticipantRepository);
    }

    @Test
    void applyJudgeResultEvent_finalizesQueuedSubmissionWithoutPolling() {
        Submission queued = new Submission();
        queued.setId(909L);
        queued.setStatus("QUEUED");
        queued.setJudgeSubmissionId("judge-sub-1");

        when(submissionRepository.findFirstByJudgeSubmissionId("judge-sub-1")).thenReturn(Optional.of(queued));
        when(submissionRepository.save(any(Submission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        JudgeResultEvent event = new JudgeResultEvent();
        event.setJudgeSubmissionId("judge-sub-1");
        event.setStatus("ACCEPTED");
        event.setRuntimeSeconds(0.245);
        event.setStdout("ok");

        boolean handled = submissionService.applyJudgeResultEvent(event);

        assertTrue(handled);
        assertEquals("ACCEPTED", queued.getStatus());
        assertEquals(245, queued.getExecutionTime());
        assertEquals("ok", queued.getOutput());
        assertNull(queued.getJudgeSubmissionId());
    }

    private User buildUser(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        return user;
    }

    private Problem buildProblem(Long id, String sampleInput, String sampleOutput) {
        Problem problem = new Problem();
        problem.setId(id);
        problem.setSampleInput(sampleInput);
        problem.setSampleOutput(sampleOutput);
        return problem;
    }
}
