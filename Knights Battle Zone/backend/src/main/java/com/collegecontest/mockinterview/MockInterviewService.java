package com.collegecontest.mockinterview;

import com.collegecontest.mockinterview.dto.AIInterviewStartRequest;
import com.collegecontest.mockinterview.dto.AIInterviewSubmitRequest;
import com.collegecontest.mockinterview.dto.InterviewFeedbackRequest;
import com.collegecontest.mockinterview.dto.InterviewQuestionAttemptDTO;
import com.collegecontest.mockinterview.dto.InterviewQuestionRequest;
import com.collegecontest.mockinterview.dto.InterviewQuestionResponse;
import com.collegecontest.mockinterview.dto.InterviewRequest;
import com.collegecontest.mockinterview.dto.InterviewResponse;
import com.collegecontest.mockinterview.dto.MasteryTrackProgressRequest;
import com.collegecontest.mockinterview.dto.MasteryTrackProgressResponse;
import com.collegecontest.mockinterview.dto.MasteryTrackSessionRequest;
import com.collegecontest.mockinterview.dto.OverallInterviewAnalyticsDTO;
import com.collegecontest.mockinterview.dto.UserInterviewAnalyticsDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class MockInterviewService {

    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() { };
    private static final TypeReference<List<InterviewQuestionAttemptDTO>> ATTEMPT_LIST_TYPE = new TypeReference<>() { };

    private final InterviewRepository interviewRepository;
    private final InterviewQuestionRepository questionRepository;
    private final InterviewProblemRepository interviewProblemRepository;
    private final InterviewMasteryProgressRepository masteryProgressRepository;
    private final ObjectMapper objectMapper;

    public MockInterviewService(
            InterviewRepository interviewRepository,
            InterviewQuestionRepository questionRepository,
            InterviewProblemRepository interviewProblemRepository,
            InterviewMasteryProgressRepository masteryProgressRepository,
            ObjectMapper objectMapper
    ) {
        this.interviewRepository = interviewRepository;
        this.questionRepository = questionRepository;
        this.interviewProblemRepository = interviewProblemRepository;
        this.masteryProgressRepository = masteryProgressRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<InterviewResponse> getUserInterviews(Long userId, String mode, String type, String status) {
        String modeFilter = normalizeUpper(mode);
        String typeFilter = normalizeUpper(type);
        String statusFilter = normalizeUpper(status);

        return interviewRepository.findByUserIdOrInterviewerId(userId, userId).stream()
                .filter(item -> modeFilter == null || modeFilter.equalsIgnoreCase(item.getMode()))
                .filter(item -> typeFilter == null || typeFilter.equalsIgnoreCase(item.getInterviewType()))
                .filter(item -> statusFilter == null || statusFilter.equalsIgnoreCase(item.getStatus()))
                .sorted(Comparator.comparing(Interview::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public InterviewResponse createSessionFromRequest(Long userId, String userName, InterviewRequest req) {
        Interview interview = Interview.builder()
                .userId(userId)
                .userName(firstNonBlank(req.getUserName(), userName))
                .interviewerId(req.getInterviewerId())
                .interviewerName(req.getInterviewerName())
                .sessionId(firstNonBlank(req.getSessionId(), shortSessionId()))
                .scheduledTime(req.getScheduledTime() != null ? req.getScheduledTime() : LocalDateTime.now().plusDays(1))
                .durationMinutes(req.getDurationMinutes() != null && req.getDurationMinutes() > 0 ? req.getDurationMinutes() : 45)
                .interviewType(normalizeInterviewType(req.getInterviewType()))
                .mode(normalizeMode(req.getMode()))
                .difficulty(normalizeDifficulty(req.getDifficulty()))
                .topics(req.getTopics())
                .meetingLink(req.getMeetingLink())
                .status("SCHEDULED")
                .build();

        Interview saved = interviewRepository.save(interview);
        saveProblems(saved, req.getProblemIds());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public InterviewResponse getInterview(Long id) {
        return interviewRepository.findById(id).map(this::toResponse).orElse(null);
    }

    @Transactional(readOnly = true)
    public InterviewResponse getInterviewBySessionId(String sessionId) {
        return interviewRepository.findBySessionId(sessionId).map(this::toResponse).orElse(null);
    }

    @Transactional
    public InterviewResponse startAiInterview(Long userId, String userName, AIInterviewStartRequest req) {
        String type = normalizeInterviewType(req.getInterviewType());
        String difficulty = normalizeDifficulty(req.getDifficulty());
        String questionFormat = normalizeQuestionFormat(req.getQuestionFormat());

        List<InterviewQuestion> pool = fetchQuestionPool(type, difficulty, questionFormat);
        int totalQuestions = safeQuestionCount(req.getQuestionCount(), questionFormat);

        Interview interview = Interview.builder()
                .userId(userId)
                .userName(userName)
                .sessionId(shortSessionId())
                .scheduledTime(LocalDateTime.now())
                .durationMinutes(req.getDurationMinutes() != null && req.getDurationMinutes() > 0 ? req.getDurationMinutes() : 45)
                .interviewType(type)
                .mode("AI")
                .difficulty(difficulty)
                .topics(mergeTopics(req.getTopics(), req.getTargetCompany()))
                .strictMode(Boolean.TRUE.equals(req.getStrictMode()))
                .negativeMarking(Boolean.TRUE.equals(req.getNegativeMarking()))
                .masteryTrackId(trimToNull(req.getMasteryTrackId()))
                .masteryTrackTitle(trimToNull(req.getMasteryTrackTitle()))
                .status("IN_PROGRESS")
                .build();

        interview = interviewRepository.save(interview);

        List<InterviewQuestionAttemptDTO> attempts = buildAttemptList(pool, totalQuestions, questionFormat, type, difficulty);
        interview.setQuestionData(toJson(attempts));
        interviewRepository.save(interview);

        if (trimToNull(req.getMasteryTrackId()) != null) {
            MasteryTrackProgressRequest progressRequest = new MasteryTrackProgressRequest();
            progressRequest.setTrackId(req.getMasteryTrackId());
            progressRequest.setTrackTitle(req.getMasteryTrackTitle());
            progressRequest.setInterviewType(type);
            progressRequest.setDifficulty(difficulty);
            progressRequest.setQuestionFormat(questionFormat);
            progressRequest.setTopics(req.getTopics());
            progressRequest.setTargetCompany(req.getTargetCompany());
            progressRequest.setStrictMode(req.getStrictMode());
            progressRequest.setNegativeMarking(req.getNegativeMarking());
            upsertMasteryTrackProgress(userId, progressRequest);
        }

        return toResponse(interview);
    }

    @Transactional
    public InterviewResponse submitAiAnswer(Long userId, AIInterviewSubmitRequest req) {
        Interview interview = interviewRepository.findById(req.getInterviewId())
                .orElseThrow(() -> new IllegalArgumentException("Interview not found"));

        if (!Objects.equals(interview.getUserId(), userId)) {
            throw new IllegalArgumentException("Not allowed");
        }
        boolean wasCompleted = "COMPLETED".equalsIgnoreCase(interview.getStatus());

        List<InterviewQuestionAttemptDTO> attempts = parseAttempts(interview.getQuestionData());
        if (attempts.isEmpty()) {
            throw new IllegalStateException("Interview question set is empty");
        }

        InterviewQuestionAttemptDTO target = attempts.stream()
                .filter(item -> Objects.equals(item.getQuestionId(), req.getQuestionId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Question not part of interview"));

        InterviewQuestion bankQuestion = req.getQuestionId() == null
                ? null
                : questionRepository.findById(req.getQuestionId()).orElse(null);

        String selectedOption = trimToNull(req.getSelectedOption());
        String answer = trimToNull(req.getAnswer());
        String format = normalizeQuestionFormat(target.getQuestionFormat());

        target.setSelectedOption(selectedOption);
        target.setUserAnswer(answer);
        target.setTimeSpent(req.getTimeSpent() != null && req.getTimeSpent() > 0 ? req.getTimeSpent() : null);

        double score = evaluateScore(interview, format, bankQuestion, selectedOption, answer);
        target.setScore(score);
        target.setAiFeedback(buildFeedback(interview, format, bankQuestion, score, selectedOption, answer));

        interview.setQuestionData(toJson(attempts));

        boolean finished = attempts.stream().allMatch(item ->
                trimToNull(item.getSelectedOption()) != null || trimToNull(item.getUserAnswer()) != null);
        if (finished) {
            completeInterviewWithAggregates(interview, attempts);
            if (!wasCompleted) {
                autoRecordMasteryFromCompletedInterview(interview);
            }
        }

        interviewRepository.save(interview);
        return toResponse(interview);
    }

    @Transactional
    public InterviewResponse requestPeerInterview(Long userId, String userName, InterviewRequest req) {
        req.setMode("PEER");
        return createSessionFromRequest(userId, userName, req);
    }

    @Transactional
    public InterviewResponse joinPeerInterview(Long currentUserId, String currentUserName, String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException("Session ID or Room Code is required");
        }
        Interview interview = interviewRepository.findBySessionId(sessionId.trim())
                .orElseThrow(() -> new IllegalArgumentException("Interview session not found with code: " + sessionId));

        if (!Objects.equals(interview.getUserId(), currentUserId)) {
            interview.setInterviewerId(currentUserId);
            interview.setInterviewerName(currentUserName);
        }
        if ("SCHEDULED".equalsIgnoreCase(interview.getStatus())) {
            interview.setStatus("IN_PROGRESS");
        }
        return toResponse(interviewRepository.save(interview));
    }

    @Transactional
    public InterviewResponse findRandomPeerMatch(Long currentUserId, String currentUserName, String role, String difficulty) {
        List<Interview> openList = interviewRepository.findByModeAndStatus("PEER", "SCHEDULED");
        Optional<Interview> available = openList.stream()
                .filter(i -> !Objects.equals(i.getUserId(), currentUserId) && i.getInterviewerId() == null)
                .findFirst();

        if (available.isPresent()) {
            Interview matched = available.get();
            matched.setInterviewerId(currentUserId);
            matched.setInterviewerName(currentUserName);
            matched.setStatus("IN_PROGRESS");
            return toResponse(interviewRepository.save(matched));
        }

        Interview newQueue = Interview.builder()
                .userId(currentUserId)
                .userName(currentUserName)
                .sessionId("KNIGHT-" + ThreadLocalRandom.current().nextInt(100000, 999999))
                .scheduledTime(LocalDateTime.now())
                .durationMinutes(45)
                .interviewType(normalizeInterviewType(role))
                .mode("PEER")
                .difficulty(normalizeDifficulty(difficulty))
                .topics(role != null ? role : "Full Stack & DSA")
                .status("SCHEDULED")
                .build();

        return toResponse(interviewRepository.save(newQueue));
    }

    @Transactional
    public InterviewResponse scheduleExpertInterview(Long userId, String userName, InterviewRequest req) {
        req.setMode("EXPERT");
        return createSessionFromRequest(userId, userName, req);
    }

    @Transactional
    public Interview addFeedbackAndRecording(Long id, InterviewFeedbackRequest req) {
        Interview interview = interviewRepository.findById(id).orElse(null);
        if (interview == null) {
            return null;
        }

        interview.setFeedback(firstNonBlank(req.getFeedback(), interview.getFeedback()));
        interview.setRecordingUrl(firstNonBlank(req.getRecordingUrl(), interview.getRecordingUrl()));
        if (req.getOverallScore() != null) {
            interview.setOverallScore(req.getOverallScore());
        }
        if (req.getTechnicalScore() != null) {
            interview.setTechnicalScore(req.getTechnicalScore());
        }
        if (req.getCommunicationScore() != null) {
            interview.setCommunicationScore(req.getCommunicationScore());
        }
        if (req.getProblemSolvingScore() != null) {
            interview.setProblemSolvingScore(req.getProblemSolvingScore());
        }
        if (req.getConfidenceScore() != null) {
            interview.setConfidenceScore(req.getConfidenceScore());
        }
        interview.setStrengths(firstNonBlank(req.getStrengths(), interview.getStrengths()));
        interview.setWeaknesses(firstNonBlank(req.getWeaknesses(), interview.getWeaknesses()));
        interview.setRecommendations(firstNonBlank(req.getRecommendations(), interview.getRecommendations()));
        if ("IN_PROGRESS".equalsIgnoreCase(interview.getStatus()) || "SCHEDULED".equalsIgnoreCase(interview.getStatus())) {
            interview.setStatus("COMPLETED");
        }

        return interviewRepository.save(interview);
    }

    @Transactional
    public void cancelInterview(Long interviewId, Long currentUserId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found"));
        boolean participant = Objects.equals(interview.getUserId(), currentUserId)
                || Objects.equals(interview.getInterviewerId(), currentUserId);
        if (!participant) {
            throw new IllegalArgumentException("Not allowed");
        }
        interview.setStatus("CANCELLED");
        interviewRepository.save(interview);
    }

    @Transactional(readOnly = true)
    public List<InterviewQuestionResponse> getQuestions(String type, String difficulty) {
        String normalizedType = normalizeUpper(type);
        String normalizedDifficulty = normalizeUpper(difficulty);

        List<InterviewQuestion> questions;
        if (normalizedType != null && normalizedDifficulty != null) {
            questions = questionRepository.findByTypeAndDifficultyAndIsActiveTrue(normalizedType, normalizedDifficulty);
        } else if (normalizedType != null) {
            questions = questionRepository.findByTypeAndIsActiveTrue(normalizedType);
        } else {
            questions = questionRepository.findByIsActiveTrueOrderByCreatedAtDesc();
        }
        return questions.stream().map(this::toQuestionResponse).toList();
    }

    @Transactional
    public InterviewQuestionResponse createQuestion(Long userId, InterviewQuestionRequest req) {
        InterviewQuestion entity = new InterviewQuestion();
        applyQuestionRequest(entity, req);
        entity.setCreatedBy(userId);
        entity.setIsActive(req.getIsActive() == null ? Boolean.TRUE : req.getIsActive());
        return toQuestionResponse(questionRepository.save(entity));
    }

    @Transactional
    public InterviewQuestionResponse updateQuestion(Long id, InterviewQuestionRequest req) {
        InterviewQuestion entity = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found"));
        applyQuestionRequest(entity, req);
        if (req.getIsActive() != null) {
            entity.setIsActive(req.getIsActive());
        }
        return toQuestionResponse(questionRepository.save(entity));
    }

    @Transactional
    public void deleteQuestion(Long id) {
        InterviewQuestion entity = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found"));
        entity.setIsActive(false);
        questionRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public UserInterviewAnalyticsDTO getUserAnalytics(Long userId) {
        List<Interview> interviews = interviewRepository.findByUserId(userId);
        List<Interview> completed = interviews.stream()
                .filter(item -> "COMPLETED".equalsIgnoreCase(item.getStatus()))
                .toList();

        double avgOverall = average(completed.stream().map(Interview::getOverallScore).toList());
        double avgTech = average(completed.stream().map(Interview::getTechnicalScore).toList());
        double avgComm = average(completed.stream().map(Interview::getCommunicationScore).toList());
        double avgProblem = average(completed.stream().map(Interview::getProblemSolvingScore).toList());
        double avgConfidence = average(completed.stream().map(Interview::getConfidenceScore).toList());

        Map<String, Double> metrics = Map.of(
                "technical", avgTech,
                "communication", avgComm,
                "problem-solving", avgProblem,
                "confidence", avgConfidence
        );

        String strongest = metrics.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("technical");
        String weakest = metrics.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("communication");

        return UserInterviewAnalyticsDTO.builder()
                .userId(userId)
                .totalInterviews(interviews.size())
                .completedInterviews(completed.size())
                .averageScore(round2(avgOverall))
                .technicalAverage(round2(avgTech))
                .communicationAverage(round2(avgComm))
                .problemSolvingAverage(round2(avgProblem))
                .confidenceAverage(round2(avgConfidence))
                .strongestArea(strongest)
                .weakestArea(weakest)
                .build();
    }

    @Transactional(readOnly = true)
    public OverallInterviewAnalyticsDTO getOverallAnalytics() {
        List<Interview> interviews = interviewRepository.findAll();
        long scheduled = interviews.stream().filter(item -> "SCHEDULED".equalsIgnoreCase(item.getStatus())).count();
        long inProgress = interviews.stream().filter(item -> "IN_PROGRESS".equalsIgnoreCase(item.getStatus())).count();
        long completed = interviews.stream().filter(item -> "COMPLETED".equalsIgnoreCase(item.getStatus())).count();

        double avgOverall = average(interviews.stream()
                .filter(item -> "COMPLETED".equalsIgnoreCase(item.getStatus()))
                .map(Interview::getOverallScore)
                .toList());

        return OverallInterviewAnalyticsDTO.builder()
                .totalUsers(interviews.stream().map(Interview::getUserId).distinct().count())
                .totalInterviews(interviews.size())
                .scheduledInterviews(scheduled)
                .inProgressInterviews(inProgress)
                .completedInterviews(completed)
                .averageOverallScore(round2(avgOverall))
                .build();
    }

    @Transactional(readOnly = true)
    public List<MasteryTrackProgressResponse> getMasteryTrackProgress(Long userId) {
        return masteryProgressRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toMasteryProgressResponse)
                .toList();
    }

    @Transactional
    public MasteryTrackProgressResponse upsertMasteryTrackProgress(Long userId, MasteryTrackProgressRequest req) {
        String trackId = trimToNull(req.getTrackId());
        if (trackId == null) {
            throw new IllegalArgumentException("Track id is required");
        }
        InterviewMasteryProgress progress = masteryProgressRepository.findByUserIdAndTrackId(userId, trackId)
                .orElseGet(() -> InterviewMasteryProgress.builder()
                        .userId(userId)
                        .trackId(trackId)
                        .build());

        applyMasteryRequest(progress, req);
        recalculateMasteryStatus(progress);
        InterviewMasteryProgress saved = masteryProgressRepository.save(progress);
        return toMasteryProgressResponse(saved);
    }

    @Transactional
    public MasteryTrackProgressResponse recordMasteryTrackSession(Long userId, MasteryTrackSessionRequest req) {
        String trackId = trimToNull(req.getTrackId());
        if (trackId == null) {
            throw new IllegalArgumentException("Track id is required");
        }
        InterviewMasteryProgress progress = masteryProgressRepository.findByUserIdAndTrackId(userId, trackId)
                .orElseGet(() -> InterviewMasteryProgress.builder()
                        .userId(userId)
                        .trackId(trackId)
                        .trackTitle(trackId)
                        .strictMode(Boolean.TRUE)
                        .negativeMarking(Boolean.TRUE)
                        .plannedSprintsPerWeek(5)
                        .currentWeek(1)
                        .build());

        Double sessionScore = resolveSessionScore(userId, req);
        progress.setCompletedSprints(safeCount(progress.getCompletedSprints()) + 1);
        progress.setTotalSessionsCompleted(safeCount(progress.getTotalSessionsCompleted()) + 1);
        if (sessionScore != null) {
            progress.setLastSessionScore(clampScore(sessionScore));
            double currentReadiness = progress.getReadinessScore() == null ? clampScore(sessionScore) : progress.getReadinessScore();
            progress.setReadinessScore(round2((currentReadiness * 0.7) + (clampScore(sessionScore) * 0.3)));
        }
        recalculateMasteryStatus(progress);
        InterviewMasteryProgress saved = masteryProgressRepository.save(progress);
        return toMasteryProgressResponse(saved);
    }

    private void applyQuestionRequest(InterviewQuestion entity, InterviewQuestionRequest req) {
        entity.setType(normalizeInterviewType(req.getType()));
        entity.setDifficulty(normalizeDifficulty(req.getDifficulty()));
        entity.setCategory(firstNonBlank(req.getCategory(), "General"));
        entity.setQuestionFormat(normalizeQuestionFormat(req.getQuestionFormat()));
        entity.setQuestion(firstNonBlank(req.getQuestion(), "Untitled question"));
        entity.setOptionsJson(toJson(req.getOptions() == null ? List.of() : req.getOptions()));
        entity.setCorrectAnswer(trimToNull(req.getCorrectAnswer()));
        entity.setExplanation(trimToNull(req.getExplanation()));
        entity.setExpectedComplexity(trimToNull(req.getExpectedComplexity()));
        entity.setCompanyTag(trimToNull(req.getCompanyTag()));
        entity.setEstimatedSeconds(req.getEstimatedSeconds());
        entity.setExpectedPoints(trimToNull(req.getExpectedPoints()));
        entity.setAiEvaluationCriteria(trimToNull(req.getAiEvaluationCriteria()));
        entity.setTags(trimToNull(req.getTags()));
    }

    private InterviewResponse toResponse(Interview interview) {
        List<Long> problemIds = interviewProblemRepository.findByInterviewIdOrderByOrderIndex(interview.getId()).stream()
                .map(item -> item.getId().getProblemId())
                .toList();

        return InterviewResponse.builder()
                .id(interview.getId())
                .sessionId(interview.getSessionId())
                .userId(interview.getUserId())
                .userName(interview.getUserName())
                .interviewerId(interview.getInterviewerId())
                .interviewerName(interview.getInterviewerName())
                .scheduledTime(interview.getScheduledTime())
                .durationMinutes(interview.getDurationMinutes())
                .interviewType(interview.getInterviewType())
                .mode(interview.getMode())
                .difficulty(interview.getDifficulty())
                .topics(interview.getTopics())
                .meetingLink(interview.getMeetingLink())
                .strictMode(Boolean.TRUE.equals(interview.getStrictMode()))
                .negativeMarking(Boolean.TRUE.equals(interview.getNegativeMarking()))
                .masteryTrackId(interview.getMasteryTrackId())
                .masteryTrackTitle(interview.getMasteryTrackTitle())
                .status(interview.getStatus())
                .feedback(interview.getFeedback())
                .recordingUrl(interview.getRecordingUrl())
                .overallScore(interview.getOverallScore())
                .technicalScore(interview.getTechnicalScore())
                .communicationScore(interview.getCommunicationScore())
                .problemSolvingScore(interview.getProblemSolvingScore())
                .confidenceScore(interview.getConfidenceScore())
                .strengths(interview.getStrengths())
                .weaknesses(interview.getWeaknesses())
                .recommendations(interview.getRecommendations())
                .certificateUrl(interview.getCertificateUrl())
                .chatTranscript(interview.getChatTranscript())
                .createdAt(interview.getCreatedAt())
                .updatedAt(interview.getUpdatedAt())
                .problemIds(problemIds)
                .questions(parseAttempts(interview.getQuestionData()))
                .build();
    }

    private InterviewQuestionResponse toQuestionResponse(InterviewQuestion question) {
        return InterviewQuestionResponse.builder()
                .id(question.getId())
                .type(question.getType())
                .difficulty(question.getDifficulty())
                .category(question.getCategory())
                .questionFormat(question.getQuestionFormat())
                .question(question.getQuestion())
                .options(parseStringList(question.getOptionsJson()))
                .correctAnswer(question.getCorrectAnswer())
                .explanation(question.getExplanation())
                .expectedComplexity(question.getExpectedComplexity())
                .companyTag(question.getCompanyTag())
                .estimatedSeconds(question.getEstimatedSeconds())
                .expectedPoints(question.getExpectedPoints())
                .aiEvaluationCriteria(question.getAiEvaluationCriteria())
                .tags(question.getTags())
                .isActive(question.getIsActive())
                .build();
    }

    private void saveProblems(Interview interview, List<Long> problemIds) {
        List<InterviewProblem> existing = interviewProblemRepository.findByInterviewIdOrderByOrderIndex(interview.getId());
        if (!existing.isEmpty()) {
            interviewProblemRepository.deleteAll(existing);
        }
        if (problemIds == null || problemIds.isEmpty()) {
            return;
        }
        int index = 0;
        for (Long problemId : problemIds.stream().filter(Objects::nonNull).distinct().toList()) {
            InterviewProblem problem = InterviewProblem.builder()
                    .id(new InterviewProblemId(interview.getId(), problemId))
                    .interview(interview)
                    .orderIndex(index++)
                    .build();
            interviewProblemRepository.save(problem);
        }
    }

    private List<InterviewQuestion> fetchQuestionPool(String type, String difficulty, String questionFormat) {
        if ("MIXED".equals(questionFormat)) {
            return questionRepository.findByTypeAndDifficultyAndIsActiveTrue(type, difficulty);
        }
        return questionRepository.findByTypeAndDifficultyAndQuestionFormatAndIsActiveTrue(type, difficulty, questionFormat);
    }

    private List<InterviewQuestionAttemptDTO> buildAttemptList(
            List<InterviewQuestion> pool,
            int totalQuestions,
            String questionFormat,
            String type,
            String difficulty
    ) {
        List<InterviewQuestionAttemptDTO> attempts = new ArrayList<>();
        List<InterviewQuestion> workingPool = new ArrayList<>(pool);
        Collections.shuffle(workingPool);

        for (InterviewQuestion question : workingPool.stream().limit(totalQuestions).toList()) {
            attempts.add(InterviewQuestionAttemptDTO.builder()
                    .questionId(question.getId())
                    .questionFormat(question.getQuestionFormat())
                    .questionText(question.getQuestion())
                    .options(parseStringList(question.getOptionsJson()))
                    .expectedComplexity(question.getExpectedComplexity())
                    .build());
        }

        if (!attempts.isEmpty()) {
            return attempts;
        }

        for (int i = 1; i <= totalQuestions; i++) {
            String format = "MIXED".equals(questionFormat) ? (i % 2 == 0 ? "MCQ" : "OPEN_ENDED") : questionFormat;
            List<String> options = "MCQ".equals(format)
                    ? List.of("Option A", "Option B", "Option C", "Option D")
                    : List.of();
            attempts.add(InterviewQuestionAttemptDTO.builder()
                    .questionId(null)
                    .questionFormat(format)
                    .questionText("[" + type + " - " + difficulty + "] Practice prompt " + i)
                    .options(options)
                    .build());
        }
        return attempts;
    }

    private void completeInterviewWithAggregates(Interview interview, List<InterviewQuestionAttemptDTO> attempts) {
        List<Double> scores = attempts.stream().map(InterviewQuestionAttemptDTO::getScore).filter(Objects::nonNull).toList();
        double avgRaw = average(scores);
        double avg = clampScore(avgRaw);
        double strictPenalty = Boolean.TRUE.equals(interview.getStrictMode()) ? 4.0 : 0.0;
        interview.setOverallScore(round2(clampScore(avg - strictPenalty)));
        interview.setTechnicalScore(round2(clampScore(avg)));
        interview.setCommunicationScore(round2(clampScore(avg + 4)));
        interview.setProblemSolvingScore(round2(clampScore(avg - (Boolean.TRUE.equals(interview.getStrictMode()) ? 2.0 : 0.0))));
        interview.setConfidenceScore(round2(clampScore(avg + 2)));
        interview.setStatus("COMPLETED");
        if (interview.getFeedback() == null || interview.getFeedback().isBlank()) {
            interview.setFeedback(avg >= 75 ? "Strong interview performance." : "Needs focused practice on fundamentals.");
        }
    }

    private double evaluateScore(
            Interview interview,
            String format,
            InterviewQuestion bankQuestion,
            String selectedOption,
            String answer
    ) {
        boolean strictMode = Boolean.TRUE.equals(interview.getStrictMode());
        boolean negativeMarking = Boolean.TRUE.equals(interview.getNegativeMarking());
        if ("MCQ".equals(format)) {
            String correct = bankQuestion == null ? null : trimToNull(bankQuestion.getCorrectAnswer());
            double positiveMark = negativeMarking ? 4.0 : 1.0;
            double negativeMark = negativeMarking ? -1.0 : 0.0;
            if (correct != null && selectedOption != null && correct.equalsIgnoreCase(selectedOption)) {
                return round2((positiveMark / positiveMark) * 100.0);
            }
            if (selectedOption == null) {
                return 0.0;
            }
            return round2((negativeMark / positiveMark) * 100.0);
        }
        int words = answer == null ? 0 : answer.trim().split("\\s+").length;
        if ("CODING".equals(format)) {
            double base = strictMode ? 26 + (words * 1.6) : 40 + (words * 2.0);
            if (strictMode && !containsKeyword(answer, "edge", "corner", "boundary")) {
                base -= 12;
            }
            if (strictMode && !containsKeyword(answer, "o(", "complexity")) {
                base -= 10;
            }
            return clampScore(base);
        }
        double base = strictMode ? 30 + (words * 1.3) : 45 + (words * 1.8);
        if (strictMode && !containsKeyword(answer, "impact", "trade", "constraint")) {
            base -= 8;
        }
        return clampScore(base);
    }

    private String buildFeedback(
            Interview interview,
            String format,
            InterviewQuestion bankQuestion,
            double score,
            String selectedOption,
            String answer
    ) {
        if ("MCQ".equals(format)) {
            String correct = bankQuestion == null ? null : trimToNull(bankQuestion.getCorrectAnswer());
            if (correct != null && selectedOption != null && correct.equalsIgnoreCase(selectedOption)) {
                return "Correct. Good conceptual clarity.";
            }
            if (Boolean.TRUE.equals(interview.getNegativeMarking()) && selectedOption != null) {
                return "Incorrect option selected. Negative marking applied, review concept and elimination strategy.";
            }
            return firstNonBlank(bankQuestion == null ? null : bankQuestion.getExplanation(), "Incorrect option selected. Review core concept once.");
        }
        if (answer == null || answer.isBlank()) {
            return "Answer was too brief. Add a structured explanation.";
        }
        if (Boolean.TRUE.equals(interview.getStrictMode()) && score < 65) {
            return "Strict evaluation active: improve structure, complexity statement, and edge-case coverage.";
        }
        if (score >= 80) {
            return "Strong response. Good structure and clarity.";
        }
        return "Reasonable attempt. Improve depth and edge-case coverage.";
    }

    private void autoRecordMasteryFromCompletedInterview(Interview interview) {
        String trackId = trimToNull(interview.getMasteryTrackId());
        if (trackId == null) {
            return;
        }
        InterviewMasteryProgress progress = masteryProgressRepository
                .findByUserIdAndTrackId(interview.getUserId(), trackId)
                .orElseGet(() -> InterviewMasteryProgress.builder()
                        .userId(interview.getUserId())
                        .trackId(trackId)
                        .trackTitle(firstNonBlank(interview.getMasteryTrackTitle(), trackId))
                        .interviewType(interview.getInterviewType())
                        .difficulty(interview.getDifficulty())
                        .questionFormat("MIXED")
                        .plannedSprintsPerWeek(5)
                        .currentWeek(1)
                        .strictMode(Boolean.TRUE.equals(interview.getStrictMode()))
                        .negativeMarking(Boolean.TRUE.equals(interview.getNegativeMarking()))
                        .build());

        progress.setStrictMode(Boolean.TRUE.equals(interview.getStrictMode()));
        progress.setNegativeMarking(Boolean.TRUE.equals(interview.getNegativeMarking()));
        progress.setTrackTitle(firstNonBlank(interview.getMasteryTrackTitle(), progress.getTrackTitle()));
        progress.setInterviewType(firstNonBlank(interview.getInterviewType(), progress.getInterviewType()));
        progress.setDifficulty(firstNonBlank(interview.getDifficulty(), progress.getDifficulty()));
        progress.setCompletedSprints(safeCount(progress.getCompletedSprints()) + 1);
        progress.setTotalSessionsCompleted(safeCount(progress.getTotalSessionsCompleted()) + 1);

        Double score = interview.getOverallScore();
        if (score != null) {
            progress.setLastSessionScore(clampScore(score));
            double baseline = progress.getReadinessScore() == null ? clampScore(score) : progress.getReadinessScore();
            progress.setReadinessScore(round2((baseline * 0.7) + (clampScore(score) * 0.3)));
        }
        recalculateMasteryStatus(progress);
        masteryProgressRepository.save(progress);
    }

    private void applyMasteryRequest(InterviewMasteryProgress progress, MasteryTrackProgressRequest req) {
        progress.setTrackTitle(firstNonBlank(req.getTrackTitle(), progress.getTrackTitle()));
        String requestedType = normalizeUpper(req.getInterviewType());
        if (requestedType != null) {
            progress.setInterviewType(normalizeInterviewType(requestedType));
        } else if (trimToNull(progress.getInterviewType()) == null) {
            progress.setInterviewType("TECHNICAL");
        }
        String requestedDifficulty = normalizeUpper(req.getDifficulty());
        if (requestedDifficulty != null) {
            progress.setDifficulty(normalizeDifficulty(requestedDifficulty));
        } else if (trimToNull(progress.getDifficulty()) == null) {
            progress.setDifficulty("INTERMEDIATE");
        }
        String requestedFormat = normalizeUpper(req.getQuestionFormat());
        if (requestedFormat != null) {
            progress.setQuestionFormat(normalizeQuestionFormat(requestedFormat));
        } else if (trimToNull(progress.getQuestionFormat()) == null) {
            progress.setQuestionFormat("MIXED");
        }
        progress.setTopics(firstNonBlank(req.getTopics(), progress.getTopics()));
        progress.setTargetCompany(firstNonBlank(req.getTargetCompany(), progress.getTargetCompany()));
        progress.setWeeklyGoal(firstNonBlank(req.getWeeklyGoal(), progress.getWeeklyGoal()));
        if (req.getPlannedSprintsPerWeek() != null) {
            progress.setPlannedSprintsPerWeek(safePositive(req.getPlannedSprintsPerWeek(), 5));
        } else if (progress.getPlannedSprintsPerWeek() == null || progress.getPlannedSprintsPerWeek() <= 0) {
            progress.setPlannedSprintsPerWeek(5);
        }
        if (req.getCurrentWeek() != null) {
            progress.setCurrentWeek(safePositive(req.getCurrentWeek(), 1));
        } else if (progress.getCurrentWeek() == null || progress.getCurrentWeek() <= 0) {
            progress.setCurrentWeek(1);
        }
        if (req.getReadinessScore() != null) {
            progress.setReadinessScore(clampScore(req.getReadinessScore()));
        } else if (progress.getReadinessScore() == null) {
            progress.setReadinessScore(60.0);
        }
        if (req.getStrictMode() != null) {
            progress.setStrictMode(req.getStrictMode());
        } else if (progress.getStrictMode() == null) {
            progress.setStrictMode(Boolean.TRUE);
        }
        if (req.getNegativeMarking() != null) {
            progress.setNegativeMarking(req.getNegativeMarking());
        } else if (progress.getNegativeMarking() == null) {
            progress.setNegativeMarking(Boolean.TRUE);
        }
        if (progress.getCompletedSprints() == null || progress.getCompletedSprints() < 0) {
            progress.setCompletedSprints(0);
        }
        if (progress.getTotalSessionsCompleted() == null || progress.getTotalSessionsCompleted() < 0) {
            progress.setTotalSessionsCompleted(0);
        }
    }

    private Double resolveSessionScore(Long userId, MasteryTrackSessionRequest req) {
        if (req.getSessionScore() != null) {
            return clampScore(req.getSessionScore());
        }
        if (req.getInterviewId() == null) {
            return null;
        }
        Interview interview = interviewRepository.findById(req.getInterviewId())
                .orElseThrow(() -> new IllegalArgumentException("Interview not found"));
        if (!Objects.equals(interview.getUserId(), userId)) {
            throw new IllegalArgumentException("Not allowed");
        }
        return interview.getOverallScore() == null ? null : clampScore(interview.getOverallScore());
    }

    private void recalculateMasteryStatus(InterviewMasteryProgress progress) {
        int currentWeek = safePositive(progress.getCurrentWeek(), 1);
        int plannedPerWeek = safePositive(progress.getPlannedSprintsPerWeek(), 5);
        int expectedSprints = Math.max(1, plannedPerWeek * currentWeek);
        int completed = safeCount(progress.getCompletedSprints());
        double readiness = progress.getReadinessScore() == null ? 0.0 : clampScore(progress.getReadinessScore());
        double completionRatio = completed / (double) expectedSprints;

        String status;
        if (completionRatio >= 1.0 && readiness >= 85.0) {
            status = "COMPLETED";
        } else if (completionRatio >= 0.7 && (readiness >= 65.0 || safeScore(progress.getLastSessionScore()) >= 65.0)) {
            status = "ON_TRACK";
        } else {
            status = "NEEDS_ATTENTION";
        }
        progress.setCurrentWeek(currentWeek);
        progress.setPlannedSprintsPerWeek(plannedPerWeek);
        progress.setStatus(status);
    }

    private MasteryTrackProgressResponse toMasteryProgressResponse(InterviewMasteryProgress progress) {
        int expectedSprints = Math.max(1, safePositive(progress.getPlannedSprintsPerWeek(), 5) * safePositive(progress.getCurrentWeek(), 1));
        double completionPercent = Math.min(100.0, round2((safeCount(progress.getCompletedSprints()) * 100.0) / expectedSprints));
        return MasteryTrackProgressResponse.builder()
                .id(progress.getId())
                .userId(progress.getUserId())
                .trackId(progress.getTrackId())
                .trackTitle(progress.getTrackTitle())
                .interviewType(progress.getInterviewType())
                .difficulty(progress.getDifficulty())
                .questionFormat(progress.getQuestionFormat())
                .topics(progress.getTopics())
                .targetCompany(progress.getTargetCompany())
                .weeklyGoal(progress.getWeeklyGoal())
                .plannedSprintsPerWeek(safePositive(progress.getPlannedSprintsPerWeek(), 5))
                .completedSprints(safeCount(progress.getCompletedSprints()))
                .totalSessionsCompleted(safeCount(progress.getTotalSessionsCompleted()))
                .currentWeek(safePositive(progress.getCurrentWeek(), 1))
                .readinessScore(round2(safeScore(progress.getReadinessScore())))
                .lastSessionScore(round2(safeScore(progress.getLastSessionScore())))
                .strictMode(Boolean.TRUE.equals(progress.getStrictMode()))
                .negativeMarking(Boolean.TRUE.equals(progress.getNegativeMarking()))
                .status(firstNonBlank(progress.getStatus(), "ON_TRACK"))
                .completionPercent(completionPercent)
                .lastSyncedAt(progress.getLastSyncedAt())
                .createdAt(progress.getCreatedAt())
                .updatedAt(progress.getUpdatedAt())
                .build();
    }

    private List<InterviewQuestionAttemptDTO> parseAttempts(String questionData) {
        try {
            if (questionData == null || questionData.isBlank()) {
                return new ArrayList<>();
            }
            List<InterviewQuestionAttemptDTO> value = objectMapper.readValue(questionData, ATTEMPT_LIST_TYPE);
            return value == null ? new ArrayList<>() : new ArrayList<>(value);
        } catch (Exception ex) {
            return new ArrayList<>();
        }
    }

    private List<String> parseStringList(String json) {
        try {
            if (json == null || json.isBlank()) {
                return List.of();
            }
            List<String> values = objectMapper.readValue(json, STRING_LIST_TYPE);
            return values == null ? List.of() : values;
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return "[]";
        }
    }

    private int safeQuestionCount(Integer questionCount, String questionFormat) {
        int fallback = "MIXED".equals(questionFormat) ? 8 : 6;
        if (questionCount == null || questionCount <= 0) {
            return fallback;
        }
        return Math.max(1, Math.min(questionCount, 25));
    }

    private String normalizeInterviewType(String value) {
        String normalized = firstNonBlank(normalizeUpper(value), "TECHNICAL");
        if (List.of("TECHNICAL", "BEHAVIORAL", "HR", "CUSTOM").contains(normalized)) {
            return normalized;
        }
        return "TECHNICAL";
    }

    private String normalizeMode(String value) {
        String normalized = firstNonBlank(normalizeUpper(value), "AI");
        if (List.of("AI", "PEER", "EXPERT").contains(normalized)) {
            return normalized;
        }
        return "AI";
    }

    private String normalizeDifficulty(String value) {
        String normalized = firstNonBlank(normalizeUpper(value), "INTERMEDIATE");
        if (List.of("BEGINNER", "INTERMEDIATE", "ADVANCED").contains(normalized)) {
            return normalized;
        }
        return "INTERMEDIATE";
    }

    private String normalizeQuestionFormat(String value) {
        String normalized = firstNonBlank(normalizeUpper(value), "MIXED");
        if (List.of("MIXED", "OPEN_ENDED", "MCQ", "CODING").contains(normalized)) {
            return normalized;
        }
        return "MIXED";
    }

    private String mergeTopics(String topics, String targetCompany) {
        String cleanTopics = trimToNull(topics);
        String cleanCompany = trimToNull(targetCompany);
        if (cleanTopics == null && cleanCompany == null) {
            return null;
        }
        if (cleanCompany == null) {
            return cleanTopics;
        }
        if (cleanTopics == null) {
            return "Target: " + cleanCompany;
        }
        return cleanTopics + " | Target: " + cleanCompany;
    }

    private String shortSessionId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 24);
    }

    private String normalizeUpper(String value) {
        String trimmed = trimToNull(value);
        return trimmed == null ? null : trimmed.toUpperCase(Locale.ROOT);
    }

    private String firstNonBlank(String first, String fallback) {
        return trimToNull(first) != null ? first.trim() : fallback;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean containsKeyword(String value, String... keywords) {
        String normalized = value == null ? "" : value.toLowerCase(Locale.ROOT);
        for (String keyword : keywords) {
            if (keyword != null && normalized.contains(keyword.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private int safeCount(Integer value) {
        return value == null || value < 0 ? 0 : value;
    }

    private int safePositive(Integer value, int fallback) {
        if (value == null || value <= 0) {
            return fallback;
        }
        return value;
    }

    private double safeScore(Double value) {
        return value == null ? 0.0 : clampScore(value);
    }

    private double clampScore(double value) {
        return Math.max(0.0, Math.min(100.0, value));
    }

    private double average(List<Double> values) {
        List<Double> cleanValues = values == null ? List.of() : values.stream().filter(Objects::nonNull).toList();
        if (cleanValues.isEmpty()) {
            return 0.0;
        }
        return cleanValues.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
