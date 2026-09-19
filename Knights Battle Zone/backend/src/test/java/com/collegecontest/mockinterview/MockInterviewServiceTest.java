package com.collegecontest.mockinterview;

import com.collegecontest.mockinterview.dto.AIInterviewSubmitRequest;
import com.collegecontest.mockinterview.dto.InterviewQuestionAttemptDTO;
import com.collegecontest.mockinterview.dto.InterviewResponse;
import com.collegecontest.mockinterview.dto.MasteryTrackProgressRequest;
import com.collegecontest.mockinterview.dto.MasteryTrackProgressResponse;
import com.collegecontest.mockinterview.dto.MasteryTrackSessionRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MockInterviewServiceTest {

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private InterviewQuestionRepository questionRepository;

    @Mock
    private InterviewProblemRepository interviewProblemRepository;

    @Mock
    private InterviewMasteryProgressRepository masteryProgressRepository;

    private MockInterviewService service;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().findAndRegisterModules();
        service = new MockInterviewService(
                interviewRepository,
                questionRepository,
                interviewProblemRepository,
                masteryProgressRepository,
                objectMapper
        );
    }

    @Test
    void submitAiAnswer_appliesNegativeMarkingForWrongMcq() throws Exception {
        Interview interview = Interview.builder()
                .id(1L)
                .userId(7L)
                .sessionId("sess-neg")
                .status("IN_PROGRESS")
                .mode("AI")
                .strictMode(false)
                .negativeMarking(true)
                .scheduledTime(LocalDateTime.now())
                .durationMinutes(30)
                .questionData(objectMapper.writeValueAsString(List.of(
                        InterviewQuestionAttemptDTO.builder()
                                .questionId(10L)
                                .questionFormat("MCQ")
                                .questionText("Pick right option")
                                .options(List.of("A", "B", "C", "D"))
                                .build()
                )))
                .build();

        InterviewQuestion question = InterviewQuestion.builder()
                .id(10L)
                .type("TECHNICAL")
                .difficulty("INTERMEDIATE")
                .category("general")
                .questionFormat("MCQ")
                .question("Pick right option")
                .correctAnswer("A")
                .isActive(true)
                .build();

        when(interviewRepository.findById(1L)).thenReturn(Optional.of(interview));
        when(questionRepository.findById(10L)).thenReturn(Optional.of(question));
        when(interviewProblemRepository.findByInterviewIdOrderByOrderIndex(1L)).thenReturn(List.of());
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AIInterviewSubmitRequest req = new AIInterviewSubmitRequest();
        req.setInterviewId(1L);
        req.setQuestionId(10L);
        req.setSelectedOption("B");
        req.setTimeSpent(35);

        InterviewResponse response = service.submitAiAnswer(7L, req);

        assertNotNull(response);
        assertEquals("COMPLETED", response.getStatus());
        assertNotNull(response.getQuestions());
        assertEquals(-25.0, response.getQuestions().get(0).getScore());
        assertEquals(0.0, response.getOverallScore());
        assertTrue(response.getQuestions().get(0).getAiFeedback().contains("Negative marking applied"));
        assertTrue(response.getNegativeMarking());
    }

    @Test
    void submitAiAnswer_strictModeScoresLowerForSameOpenEndedAnswer() throws Exception {
        Interview normalInterview = Interview.builder()
                .id(2L)
                .userId(9L)
                .sessionId("sess-normal")
                .status("IN_PROGRESS")
                .mode("AI")
                .strictMode(false)
                .negativeMarking(false)
                .scheduledTime(LocalDateTime.now())
                .durationMinutes(30)
                .questionData(objectMapper.writeValueAsString(List.of(
                        InterviewQuestionAttemptDTO.builder()
                                .questionId(20L)
                                .questionFormat("OPEN_ENDED")
                                .questionText("Explain your approach")
                                .build()
                )))
                .build();

        Interview strictInterview = Interview.builder()
                .id(3L)
                .userId(9L)
                .sessionId("sess-strict")
                .status("IN_PROGRESS")
                .mode("AI")
                .strictMode(true)
                .negativeMarking(false)
                .scheduledTime(LocalDateTime.now())
                .durationMinutes(30)
                .questionData(objectMapper.writeValueAsString(List.of(
                        InterviewQuestionAttemptDTO.builder()
                                .questionId(20L)
                                .questionFormat("OPEN_ENDED")
                                .questionText("Explain your approach")
                                .build()
                )))
                .build();

        when(interviewRepository.findById(2L)).thenReturn(Optional.of(normalInterview));
        when(interviewRepository.findById(3L)).thenReturn(Optional.of(strictInterview));
        when(questionRepository.findById(20L)).thenReturn(Optional.empty());
        when(interviewProblemRepository.findByInterviewIdOrderByOrderIndex(2L)).thenReturn(List.of());
        when(interviewProblemRepository.findByInterviewIdOrderByOrderIndex(3L)).thenReturn(List.of());
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AIInterviewSubmitRequest normalReq = new AIInterviewSubmitRequest();
        normalReq.setInterviewId(2L);
        normalReq.setQuestionId(20L);
        normalReq.setAnswer("quick answer");
        normalReq.setTimeSpent(30);

        AIInterviewSubmitRequest strictReq = new AIInterviewSubmitRequest();
        strictReq.setInterviewId(3L);
        strictReq.setQuestionId(20L);
        strictReq.setAnswer("quick answer");
        strictReq.setTimeSpent(30);

        InterviewResponse normalResponse = service.submitAiAnswer(9L, normalReq);
        InterviewResponse strictResponse = service.submitAiAnswer(9L, strictReq);

        double normalScore = normalResponse.getQuestions().get(0).getScore();
        double strictScore = strictResponse.getQuestions().get(0).getScore();

        assertTrue(strictScore < normalScore);
        assertTrue(strictResponse.getQuestions().get(0).getAiFeedback().contains("Strict evaluation active"));
        assertTrue(strictResponse.getStrictMode());
    }

    @Test
    void upsertMasteryTrackProgress_persistsTrackConfiguration() {
        when(masteryProgressRepository.findByUserIdAndTrackId(5L, "dsa-accelerator"))
                .thenReturn(Optional.empty());
        when(masteryProgressRepository.save(any(InterviewMasteryProgress.class))).thenAnswer(invocation -> {
            InterviewMasteryProgress progress = invocation.getArgument(0);
            if (progress.getId() == null) {
                progress.setId(55L);
            }
            return progress;
        });

        MasteryTrackProgressRequest req = new MasteryTrackProgressRequest();
        req.setTrackId("dsa-accelerator");
        req.setTrackTitle("DSA Accelerator");
        req.setInterviewType("TECHNICAL");
        req.setDifficulty("ADVANCED");
        req.setQuestionFormat("MIXED");
        req.setTopics("Arrays, Graphs");
        req.setTargetCompany("Google");
        req.setWeeklyGoal("5 full interviews + 2 hard revision blocks");
        req.setPlannedSprintsPerWeek(5);
        req.setCurrentWeek(1);
        req.setReadinessScore(78.0);
        req.setStrictMode(true);
        req.setNegativeMarking(true);

        MasteryTrackProgressResponse response = service.upsertMasteryTrackProgress(5L, req);

        assertNotNull(response);
        assertEquals("dsa-accelerator", response.getTrackId());
        assertEquals("DSA Accelerator", response.getTrackTitle());
        assertTrue(response.getStrictMode());
        assertTrue(response.getNegativeMarking());
        assertEquals("NEEDS_ATTENTION", response.getStatus());
        verify(masteryProgressRepository).save(any(InterviewMasteryProgress.class));
    }

    @Test
    void recordMasteryTrackSession_incrementsSprintsAndUpdatesReadiness() {
        InterviewMasteryProgress existing = InterviewMasteryProgress.builder()
                .id(88L)
                .userId(6L)
                .trackId("dsa-accelerator")
                .trackTitle("DSA Accelerator")
                .plannedSprintsPerWeek(5)
                .currentWeek(1)
                .completedSprints(1)
                .totalSessionsCompleted(1)
                .readinessScore(60.0)
                .strictMode(true)
                .negativeMarking(true)
                .status("NEEDS_ATTENTION")
                .build();

        when(masteryProgressRepository.findByUserIdAndTrackId(6L, "dsa-accelerator"))
                .thenReturn(Optional.of(existing));
        when(masteryProgressRepository.save(any(InterviewMasteryProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MasteryTrackSessionRequest req = new MasteryTrackSessionRequest();
        req.setTrackId("dsa-accelerator");
        req.setSessionScore(88.0);

        MasteryTrackProgressResponse response = service.recordMasteryTrackSession(6L, req);

        assertNotNull(response);
        assertEquals(2, response.getCompletedSprints());
        assertEquals(2, response.getTotalSessionsCompleted());
        assertEquals(88.0, response.getLastSessionScore());
        assertTrue(response.getReadinessScore() > 60.0);
        verify(masteryProgressRepository).save(any(InterviewMasteryProgress.class));
    }

    @Test
    void getMasteryTrackProgress_returnsComputedCompletionPercent() {
        InterviewMasteryProgress progress = InterviewMasteryProgress.builder()
                .id(101L)
                .userId(9L)
                .trackId("system-design")
                .trackTitle("System Design Sprint")
                .plannedSprintsPerWeek(4)
                .currentWeek(2)
                .completedSprints(3)
                .totalSessionsCompleted(3)
                .readinessScore(69.0)
                .lastSessionScore(62.0)
                .strictMode(true)
                .negativeMarking(true)
                .status("NEEDS_ATTENTION")
                .build();

        when(masteryProgressRepository.findByUserIdOrderByUpdatedAtDesc(9L)).thenReturn(List.of(progress));

        List<MasteryTrackProgressResponse> out = service.getMasteryTrackProgress(9L);

        assertEquals(1, out.size());
        assertEquals("system-design", out.get(0).getTrackId());
        assertEquals(37.5, out.get(0).getCompletionPercent());
        assertEquals("NEEDS_ATTENTION", out.get(0).getStatus());
        assertTrue(out.get(0).getStrictMode());
        assertTrue(out.get(0).getNegativeMarking());
    }
}
