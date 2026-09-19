package com.collegecontest.service;

import com.collegecontest.dto.SubmissionDTO;
import com.collegecontest.judge.events.JudgeResultEvent;
import com.collegecontest.model.Contest;
import com.collegecontest.model.ContestParticipant;
import com.collegecontest.model.Problem;
import com.collegecontest.model.Submission;
import com.collegecontest.model.User;
import com.collegecontest.duel.service.DuelService;
import com.collegecontest.problemset.service.ProblemSetService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.collegecontest.repository.ContestParticipantRepository;
import com.collegecontest.repository.ContestRepository;
import com.collegecontest.repository.ProblemRepository;
import com.collegecontest.repository.SubmissionRepository;
import com.collegecontest.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SubmissionService {
    private static final Logger log = LoggerFactory.getLogger(SubmissionService.class);
    private static final String PROBLEM_SET_CONTEST_TITLE = "Coding Core Problem Set (100)";
    private static final String CORE_PROBLEM_PREFIX = "core problem";
    private static final String STATUS_JUDGE_UNAVAILABLE = "JUDGE_UNAVAILABLE";
    private static final String STATUS_QUEUED = "QUEUED";
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_RUNNING = "RUNNING";
    private static final String QUEUED_OUTPUT_MESSAGE = "Judge temporarily unavailable. Submission queued for automatic retry.";
    private static final String ASYNC_QUEUED_OUTPUT_MESSAGE = "Submission accepted and queued for asynchronous judging.";
    private static final String QUEUE_LANE_SUBMIT = "submit";
    private static final String QUEUE_LANE_RUN = "run";
    private static final String QUEUE_LANE_HIGH = "high";
    private static final String LANGUAGE_JAVA = "java";

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired(required = false)
    private ProblemSetService problemSetService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContestParticipantRepository contestParticipantRepository;

    @Autowired
    private ContestRepository contestRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired(required = false)
    private ObjectMapper objectMapper;

    @Autowired
    private SuddenDeathService suddenDeathService;
    @Autowired
    private ComebackBonusService comebackBonusService;
    @Autowired
    private SpeedCodingService speedCodingService;
    @Autowired
    private AccuracyModeService accuracyModeService;
    @Autowired
    private DuelService duelService;

    @Autowired(required = false)
    private CacheManager cacheManager;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Value("${judge.service.url}")
    private String judgeUrl;

    @Value("${judge.auth.token}")
    private String judgeAuthToken;

    @Value("${judge.poll.interval-ms:250}")
    private long judgePollIntervalMs = 250L;

    @Value("${judge.poll.timeout-ms:12000}")
    private long judgePollTimeoutMs = 12000L;

    @Value("${judge.async.enabled:false}")
    private boolean judgeAsyncEnabled = false;

    @Value("${judge.async.legacy-fallback-enabled:true}")
    private boolean judgeAsyncLegacyFallbackEnabled = true;

    @Value("${judge.async.non-blocking-enabled:true}")
    private boolean judgeAsyncNonBlockingEnabled = true;

    @Value("${judge.retry.max-attempts:3}")
    private int judgeRetryMaxAttempts = 3;

    @Value("${judge.retry.delay-ms:300}")
    private long judgeRetryDelayMs = 300L;

    @Value("${judge.circuit.failure-threshold:5}")
    private int judgeCircuitFailureThreshold = 5;

    @Value("${judge.circuit.open-ms:20000}")
    private long judgeCircuitOpenMs = 20000L;

    @Value("${judge.testcase.cache-ttl-ms:900000}")
    private long judgeTestCaseCacheTtlMs = 900_000L;

    @Value("${judge.queue.retry-batch-size:50}")
    private int judgeQueueRetryBatchSize = 50;

    @Value("${judge.queue.high-priority-window-seconds:300}")
    private long judgeQueueHighPriorityWindowSeconds = 300L;

    @Value("${judge.queue.poll-legacy-status-enabled:false}")
    private boolean judgeQueuePollLegacyStatusEnabled = false;

    @Value("${judge.events.result-consumer-enabled:true}")
    private boolean judgeResultConsumerEnabled = true;

    @Value("${judge.run.prefer-legacy:true}")
    private boolean judgeRunPreferLegacy = true;

    @Value("${judge.run.max-attempts:1}")
    private int judgeRunMaxAttempts = 1;

    @Value("${judge.run.async-fallback-enabled:false}")
    private boolean judgeRunAsyncFallbackEnabled = false;

    @Value("${judge.run.poll-timeout-ms:2500}")
    private long judgeRunPollTimeoutMs = 2500L;

    @Value("${judge.run.compile-grace-seconds:4}")
    private int judgeRunCompileGraceSeconds = 4;

    @Value("${judge.execution.memory-mb:256}")
    private int judgeExecutionMemoryMb = 256;

    @Value("${judge.execution.cpus:1.0}")
    private double judgeExecutionCpus = 1.0;

    @Value("${judge.execution.time-limit-floor-seconds:2}")
    private int judgeExecutionTimeFloorSeconds = 2;

    private volatile int consecutiveJudgeFailures = 0;
    private volatile long circuitOpenUntilMs = 0L;
    private final Object circuitLock = new Object();
    private final Map<String, Long> judgeTestCaseSyncCache = new ConcurrentHashMap<>();

    private static class ExecutionResult {
        private final String status;
        private final String output;
        private final Integer executionTime;

        private ExecutionResult(String status, String output, Integer executionTime) {
            this.status = status;
            this.output = output;
            this.executionTime = executionTime;
        }
    }

    private static class JudgeTestCasePayload {
        private final String inputData;
        private final String expectedOutput;
        private final boolean hidden;

        private JudgeTestCasePayload(String inputData, String expectedOutput, boolean hidden) {
            this.inputData = inputData;
            this.expectedOutput = expectedOutput;
            this.hidden = hidden;
        }
    }

    public SubmissionDTO submitCode(SubmissionDTO dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Problem problem = problemRepository.findById(dto.getProblemId())
                .orElseThrow(() -> new RuntimeException("Problem not found with id: " + dto.getProblemId()));
        validateContestAttemptWindow(problem, user.getId());

        Submission submission = new Submission();
        String normalizedLanguage = normalizeJudgeLanguage(dto.getLanguage());
        submission.setUser(user);
        submission.setProblem(problem);
        submission.setCode(dto.getCode());
        submission.setLanguage(normalizedLanguage);
        submission.setStatus(STATUS_PENDING);
        submission.setSubmittedAt(LocalDateTime.now());

        Submission savedSubmission = submissionRepository.save(submission);
        Submission finalSaved;
        if (judgeAsyncEnabled && judgeAsyncNonBlockingEnabled) {
            String lane = resolveSubmitLane(problem, user.getId());
            String judgeSubmissionId = submitToAsyncJudge(problem, dto.getCode(), normalizedLanguage, lane);
            if (judgeSubmissionId != null) {
                savedSubmission.setStatus(STATUS_QUEUED);
                savedSubmission.setJudgeSubmissionId(judgeSubmissionId);
                savedSubmission.setOutput(ASYNC_QUEUED_OUTPUT_MESSAGE);
                savedSubmission.setExecutionTime(0);
                finalSaved = submissionRepository.save(savedSubmission);
                broadcastSubmissionStatusUpdate(finalSaved);
            } else {
                ExecutionResult fallbackResult = evaluateAgainstSample(problem, dto.getCode(), normalizedLanguage);
                if (STATUS_JUDGE_UNAVAILABLE.equalsIgnoreCase(fallbackResult.status)) {
                    savedSubmission.setStatus(STATUS_QUEUED);
                    savedSubmission.setOutput(fallbackResult.output);
                    savedSubmission.setExecutionTime(0);
                    finalSaved = submissionRepository.save(savedSubmission);
                    broadcastSubmissionStatusUpdate(finalSaved);
                } else {
                    finalSaved = finalizeSubmission(savedSubmission, fallbackResult);
                }
            }
        } else {
            ExecutionResult executionResult = evaluateAgainstSample(problem, dto.getCode(), normalizedLanguage);
            if (STATUS_JUDGE_UNAVAILABLE.equalsIgnoreCase(executionResult.status)) {
                savedSubmission.setStatus(STATUS_QUEUED);
                savedSubmission.setOutput(executionResult.output);
                savedSubmission.setExecutionTime(0);
                finalSaved = submissionRepository.save(savedSubmission);
                broadcastSubmissionStatusUpdate(finalSaved);
            } else {
                finalSaved = finalizeSubmission(savedSubmission, executionResult);
            }
        }

        SubmissionDTO out = new SubmissionDTO();
        out.setId(finalSaved.getId());
        out.setProblemId(finalSaved.getProblem().getId());
        out.setCode(finalSaved.getCode());
        out.setLanguage(normalizedLanguage);
        out.setStatus(finalSaved.getStatus());
        out.setOutput(finalSaved.getOutput());
        out.setJudgeSubmissionId(finalSaved.getJudgeSubmissionId());
        out.setExecutionTime(finalSaved.getExecutionTime());
        out.setSubmittedAt(finalSaved.getSubmittedAt());
        return out;
    }

    public SubmissionDTO runCode(SubmissionDTO dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Problem problem = problemRepository.findById(dto.getProblemId())
                .orElseThrow(() -> new RuntimeException("Problem not found with id: " + dto.getProblemId()));

        validateContestAttemptWindow(problem, user.getId());

        String normalizedLanguage = normalizeJudgeLanguage(dto.getLanguage());
        ExecutionResult executionResult = evaluateForRun(problem, dto.getCode(), normalizedLanguage);

        SubmissionDTO out = new SubmissionDTO();
        out.setProblemId(problem.getId());
        out.setCode(dto.getCode());
        out.setLanguage(normalizedLanguage);
        out.setStatus(executionResult.status);
        out.setOutput(executionResult.output);
        out.setExecutionTime(executionResult.executionTime);
        out.setSubmittedAt(LocalDateTime.now());
        return out;
    }

    private ExecutionResult evaluateForRun(Problem problem, String code, String language) {
        if (!judgeRunPreferLegacy) {
            if (judgeAsyncEnabled) {
                ExecutionResult asyncResult = evaluateViaAsyncJudge(
                        problem,
                        code,
                        language,
                        QUEUE_LANE_RUN,
                        judgeRunPollTimeoutMs,
                        true);
                if (asyncResult != null && !shouldFallbackToLegacy(asyncResult)) {
                    return asyncResult;
                }
            }
            return evaluateViaLegacyJudge(problem, code, language, resolveRunLegacyTimeLimit(problem));
        }

        if (isJudgeCircuitOpen() && !judgeAsyncEnabled) {
            return unavailableExecutionResult("Circuit breaker is open.");
        }

        String lastTransportError = null;
        int attempts = Math.max(1, judgeRunMaxAttempts);
        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                ExecutionResult legacyResult = evaluateViaLegacyJudge(problem, code, language, resolveRunLegacyTimeLimit(problem));
                if (!isLegacyInfrastructureFailure(legacyResult)) {
                    recordJudgeSuccess();
                    return legacyResult;
                }
                lastTransportError = legacyResult.output;
                recordJudgeFailure();
            } catch (RestClientException ex) {
                lastTransportError = ex.getMessage();
                recordJudgeFailure();
            }

            if (attempt < attempts) {
                sleepRetryDelay();
            }
        }

        if (judgeAsyncEnabled && judgeRunAsyncFallbackEnabled) {
            ExecutionResult asyncResult = evaluateViaAsyncJudge(
                    problem,
                    code,
                    language,
                    QUEUE_LANE_RUN,
                    judgeRunPollTimeoutMs,
                    true);
            if (asyncResult != null && !shouldFallbackToLegacy(asyncResult)) {
                recordJudgeSuccess();
                return asyncResult;
            }
        }

        return unavailableExecutionResult(lastTransportError);
    }

    private void validateContestAttemptWindow(Problem problem, Long userId) {
        if (problem.getContest() == null) {
            return;
        }
        if (isProblemInResolvedProblemSet(problem.getId())) {
            return;
        }
        if (isProblemSetProblem(problem)) {
            return;
        }
        if (isProblemSetContest(problem.getContest())) {
            // Practice problem-set should never be blocked by contest attempt windows.
            return;
        }

        Long contestId = problem.getContest().getId();
        Contest contest = contestRepository.findById(contestId).orElse(null);
        if (contest == null) {
            return;
        }
        if (isProblemSetContest(contest)) {
            // Problem-set flow is practice mode and must never be blocked by contest timer windows.
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        if (contest.getEndTime() != null && now.isAfter(contest.getEndTime())) {
            // Contest is already over: allow practice attempts.
            return;
        }
        if (contest.getStartTime() != null && now.isBefore(contest.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contest has not opened yet.");
        }

        ContestParticipant participant = contestParticipantRepository.findByContestIdAndUserId(contestId, userId)
                .orElseGet(() -> createContestParticipant(contest, userId, now));

        if (participant.getAttemptStartTime() == null) {
            participant.setRegisteredAt(now);
            participant.setAttemptStartTime(now);
            participant.setAttemptEndTime(now.plusMinutes(resolveContestDurationMinutes(contest)));
            participant = contestParticipantRepository.save(participant);
        }

        if (participant.getAttemptEndTime() != null
                && now.isAfter(participant.getAttemptEndTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Your contest time is over.");
        }
    }

    private ContestParticipant createContestParticipant(Contest contest, Long userId, LocalDateTime now) {
        ContestParticipant participant = new ContestParticipant();
        participant.setContestId(contest.getId());
        participant.setUserId(userId);
        participant.setEliminated(false);
        participant.setTotalScore(0.0);
        participant.setRegisteredAt(now);
        participant.setAttemptStartTime(now);
        participant.setAttemptEndTime(now.plusMinutes(resolveContestDurationMinutes(contest)));
        return contestParticipantRepository.save(participant);
    }

    private int resolveContestDurationMinutes(Contest contest) {
        if (contest.getDurationMinutes() != null && contest.getDurationMinutes() > 0) {
            return contest.getDurationMinutes();
        }
        if (contest.getStartTime() != null && contest.getEndTime() != null) {
            long minutes = java.time.Duration.between(contest.getStartTime(), contest.getEndTime()).toMinutes();
            if (minutes > 0) {
                return (int) minutes;
            }
        }
        return 60;
    }

    private boolean isProblemSetContest(Contest contest) {
        if (contest == null) {
            return false;
        }
        String mode = contest.getMode();
        if (mode != null && "PROBLEM_SET".equalsIgnoreCase(mode.trim())) {
            return true;
        }
        String title = contest.getTitle();
        if (title == null) {
            return false;
        }
        String normalizedTitle = title.trim().toLowerCase(Locale.ROOT);
        if (PROBLEM_SET_CONTEST_TITLE.equalsIgnoreCase(normalizedTitle)) {
            return true;
        }
        return normalizedTitle.contains("problem set");
    }

    private boolean isProblemSetProblem(Problem problem) {
        if (problem == null) {
            return false;
        }
        String title = problem.getTitle();
        if (title == null) {
            return false;
        }
        return title.trim().toLowerCase(Locale.ROOT).startsWith(CORE_PROBLEM_PREFIX);
    }

    private boolean isProblemInResolvedProblemSet(Long problemId) {
        if (problemId == null || problemSetService == null) {
            return false;
        }
        try {
            Long problemSetContestId = problemSetService.getProblemSetContestId();
            if (problemSetContestId == null) {
                return false;
            }
            return problemRepository.existsByIdAndContestId(problemId, problemSetContestId);
        } catch (Exception ex) {
            log.debug("Problem-set membership check failed for problemId={}: {}", problemId, ex.getMessage());
            return false;
        }
    }

    public List<SubmissionDTO> getSubmissionsByUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return submissionRepository.findByUserIdOrderBySubmittedAtDesc(user.getId()).stream().map(s -> {
            SubmissionDTO dto = new SubmissionDTO();
            dto.setId(s.getId());
            dto.setProblemId(s.getProblem().getId());
            dto.setCode(s.getCode());
            dto.setLanguage(s.getLanguage());
            dto.setStatus(s.getStatus());
            dto.setOutput(s.getOutput());
            dto.setJudgeSubmissionId(s.getJudgeSubmissionId());
            dto.setExecutionTime(s.getExecutionTime());
            dto.setSubmittedAt(s.getSubmittedAt());
            return dto;
        }).toList();
    }

    public List<SubmissionDTO> getSubmissionsByProblem(Long problemId) {
        return submissionRepository.findByProblemIdOrderBySubmittedAtDesc(problemId).stream().map(s -> {
            SubmissionDTO dto = new SubmissionDTO();
            dto.setId(s.getId());
            dto.setProblemId(s.getProblem().getId());
            dto.setCode(s.getCode());
            dto.setLanguage(s.getLanguage());
            dto.setStatus(s.getStatus());
            dto.setOutput(s.getOutput());
            dto.setJudgeSubmissionId(s.getJudgeSubmissionId());
            dto.setExecutionTime(s.getExecutionTime());
            dto.setSubmittedAt(s.getSubmittedAt());
            return dto;
        }).toList();
    }

    private ExecutionResult evaluateAgainstSample(Problem problem, String code, String language) {
        if (isJudgeCircuitOpen()) {
            return unavailableExecutionResult("Circuit breaker is open.");
        }

        String lastTransportError = null;
        int attempts = Math.max(1, judgeRetryMaxAttempts);

        for (int attempt = 1; attempt <= attempts; attempt++) {
            if (judgeAsyncEnabled) {
                ExecutionResult asyncResult = evaluateViaAsyncJudge(problem, code, language);
                if (asyncResult != null) {
                    if (shouldFallbackToLegacy(asyncResult)) {
                        if (!judgeAsyncLegacyFallbackEnabled) {
                            lastTransportError = "Async judge returned infrastructure-like status.";
                            recordJudgeFailure();
                            log.warn("Async judge fallback disabled; queueing submission for problem {}", problem.getId());
                            if (attempt < attempts) {
                                sleepRetryDelay();
                            }
                            continue;
                        }
                        log.warn("Async judge returned infra-like error, trying legacy fallback for problem {}", problem.getId());
                    } else {
                        recordJudgeSuccess();
                        return asyncResult;
                    }
                } else if (!judgeAsyncLegacyFallbackEnabled) {
                    lastTransportError = "Async judge timed out before terminal status.";
                    recordJudgeFailure();
                    if (attempt < attempts) {
                        sleepRetryDelay();
                    }
                    continue;
                }
            }

            if (judgeAsyncEnabled && !judgeAsyncLegacyFallbackEnabled) {
                continue;
            }

            try {
                ExecutionResult legacyResult = evaluateViaLegacyJudge(problem, code, language);
                if (isLegacyInfrastructureFailure(legacyResult)) {
                    lastTransportError = legacyResult.output;
                    recordJudgeFailure();
                    log.warn("Legacy judge returned infrastructure failure on attempt {}/{}: {}", attempt, attempts,
                            legacyResult.output);
                } else {
                    recordJudgeSuccess();
                    return legacyResult;
                }
            } catch (RestClientException ex) {
                lastTransportError = ex.getMessage();
                recordJudgeFailure();
                log.warn("Judge call failed on attempt {}/{}: {}", attempt, attempts, ex.getMessage());
            }

            if (attempt < attempts) {
                sleepRetryDelay();
            }

            if (isJudgeCircuitOpen()) {
                break;
            }
        }

        return unavailableExecutionResult(lastTransportError);
    }

    private boolean shouldFallbackToLegacy(ExecutionResult asyncResult) {
        if (!"RUNTIME_ERROR".equalsIgnoreCase(asyncResult.status)) {
            return false;
        }

        String output = asyncResult.output == null ? "" : asyncResult.output.trim();
        if (output.isBlank()) {
            return true;
        }

        String normalized = output.toLowerCase(Locale.ROOT);
        return normalized.contains("no testcase")
                || normalized.contains("no test case")
                || normalized.contains("no problem id")
                || normalized.contains("unknown judge status");
    }

    private ExecutionResult evaluateViaLegacyJudge(Problem problem, String code, String language) {
        return evaluateViaLegacyJudge(problem, code, language, resolveJudgeExecutionTimeLimit(problem));
    }

    private int resolveRunLegacyTimeLimit(Problem problem) {
        int baseLimit = resolveJudgeExecutionTimeLimit(problem);
        int compileGraceSeconds = Math.max(0, judgeRunCompileGraceSeconds);
        return Math.max(1, baseLimit + compileGraceSeconds);
    }

    private ExecutionResult evaluateViaLegacyJudge(Problem problem, String code, String language, int effectiveTimeLimitSeconds) {
        try {
            String normalizedLanguage = normalizeJudgeLanguage(language);
            Map<String, Object> judgeRequest = new HashMap<>();
            judgeRequest.put("code", code);
            judgeRequest.put("language", normalizedLanguage);
            judgeRequest.put("input", problem.getSampleInput());
            judgeRequest.put("timeLimitSeconds", Math.max(1, effectiveTimeLimitSeconds));
            judgeRequest.put("memoryMb", resolveJudgeExecutionMemoryMb());
            judgeRequest.put("cpus", resolveJudgeExecutionCpus());

            Map<String, Object> judgeResponse = judgePost(
                    judgeUrl + "/execute",
                    judgeRequest,
                    Map.class);

            String judgeStatus = judgeResponse != null ? stringValue(judgeResponse.get("status")) : null;
            String output = judgeResponse != null ? (String) judgeResponse.get("output") : "";
            String error = judgeResponse != null ? (String) judgeResponse.get("error") : null;
            Long executionTime = judgeResponse != null
                    ? ((Number) judgeResponse.getOrDefault("executionTime", 0)).longValue()
                    : 0L;

            if (judgeStatus != null && !judgeStatus.isBlank()) {
                String normalizedStatus = judgeStatus.trim().toLowerCase(Locale.ROOT);
                if ("compile_error".equals(normalizedStatus)) {
                    return new ExecutionResult("COMPILE_ERROR", firstNonBlank(error, output, "Compilation failed"), executionTime.intValue());
                }
                if ("timeout".equals(normalizedStatus)) {
                    return new ExecutionResult("TIME_LIMIT", firstNonBlank(error, output, "Execution timed out"), executionTime.intValue());
                }
                if ("runtime_error".equals(normalizedStatus) || "error".equals(normalizedStatus)) {
                    return new ExecutionResult("RUNTIME_ERROR", firstNonBlank(error, output, "Runtime error"), executionTime.intValue());
                }
            }

            if (error != null) {
                String normalizedError = error.toLowerCase(Locale.ROOT);
                if (normalizedError.contains("timeout")) {
                    return new ExecutionResult("TIME_LIMIT", error, executionTime.intValue());
                }
                if (isLikelyCompilationError(normalizedError)) {
                    return new ExecutionResult("COMPILE_ERROR", error, executionTime.intValue());
                }
                return new ExecutionResult("RUNTIME_ERROR", error, executionTime.intValue());
            }

            String expectedOutput = problem.getSampleOutput() != null ? problem.getSampleOutput().trim() : "";
            String actualOutput = output != null ? output.trim() : "";
            if (actualOutput.equals(expectedOutput)) {
                return new ExecutionResult("ACCEPTED", output, executionTime.intValue());
            }
            return new ExecutionResult("WRONG_ANSWER", output, executionTime.intValue());
        } catch (RestClientException ex) {
            throw ex;
        } catch (Exception ex) {
            return new ExecutionResult("RUNTIME_ERROR", "Error: " + ex.getMessage(), 0);
        }
    }

    private ExecutionResult evaluateViaAsyncJudge(Problem problem, String code, String language) {
        return evaluateViaAsyncJudge(problem, code, language, QUEUE_LANE_SUBMIT, judgePollTimeoutMs, false);
    }

    private ExecutionResult evaluateViaAsyncJudge(Problem problem, String code, String language, String queueLane) {
        return evaluateViaAsyncJudge(problem, code, language, queueLane, judgePollTimeoutMs, false);
    }

    private ExecutionResult evaluateViaAsyncJudge(
            Problem problem,
            String code,
            String language,
            String queueLane,
            long pollTimeoutMs,
            boolean skipTestCaseSync) {
        try {
            String submissionId = submitToAsyncJudge(problem, code, language, queueLane, skipTestCaseSync);
            if (submissionId == null) {
                return null;
            }
            long deadline = System.currentTimeMillis() + Math.max(pollTimeoutMs, 750L);
            String baseUrl = normalizeJudgeBaseUrl();

            while (System.currentTimeMillis() <= deadline) {
                ExecutionResult polled = pollAsyncJudgeStatus(baseUrl, submissionId);
                if (polled != null) {
                    return polled;
                }
                sleepPollingInterval();
            }

            log.warn("Async judge timed out while polling result for problem {}", problem.getId());
            return null;
        } catch (RestClientException e) {
            log.debug("Async judge endpoint unavailable: {}", e.getMessage());
            return null;
        }
    }

    private String submitToAsyncJudge(Problem problem, String code, String language) {
        return submitToAsyncJudge(problem, code, language, QUEUE_LANE_SUBMIT);
    }

    private String submitToAsyncJudge(Problem problem, String code, String language, String queueLane) {
        return submitToAsyncJudge(problem, code, language, queueLane, false);
    }

    private String submitToAsyncJudge(
            Problem problem,
            String code,
            String language,
            String queueLane,
            boolean skipTestCaseSync) {
        if (problem == null || problem.getId() == null) {
            return null;
        }
        try {
            String baseUrl = normalizeJudgeBaseUrl();
            if (!skipTestCaseSync) {
                ensureJudgeTestCases(problem, baseUrl);
            }

            Map<String, Object> submitRequest = new HashMap<>();
            submitRequest.put("code", code);
            submitRequest.put("language", language);
            submitRequest.put("problemId", String.valueOf(problem.getId()));
            submitRequest.put("timeLimitSeconds", resolveJudgeExecutionTimeLimit(problem));
            submitRequest.put("memoryMb", resolveJudgeExecutionMemoryMb());
            submitRequest.put("cpus", resolveJudgeExecutionCpus());
            submitRequest.put("queueLane", normalizeQueueLane(queueLane));

            Map<String, Object> submitResponse = judgePost(
                    baseUrl + "/judge/submit",
                    submitRequest,
                    Map.class);

            if (submitResponse == null || submitResponse.get("submissionId") == null) {
                return null;
            }
            return String.valueOf(submitResponse.get("submissionId"));
        } catch (RestClientException ex) {
            log.debug("Async judge submission request failed for problem {}: {}", problem.getId(), ex.getMessage());
            return null;
        }
    }

    private ExecutionResult pollAsyncJudgeStatus(String baseUrl, String submissionId) {
        Map<String, Object> statusResponse = judgeGet(
                baseUrl + "/judge/status/" + submissionId,
                Map.class);
        if (statusResponse == null) {
            return null;
        }

        String status = stringValue(statusResponse.get("status"));
        if (status == null || status.isBlank()
                || STATUS_PENDING.equalsIgnoreCase(status)
                || STATUS_RUNNING.equalsIgnoreCase(status)) {
            return null;
        }

        Integer executionTimeMs = toMillis(statusResponse.get("runtimeSeconds"));
        String output = extractJudgeOutput(statusResponse);
        return mapJudgeTerminalStatus(status, output, executionTimeMs);
    }

    private void ensureJudgeTestCases(Problem problem, String baseUrl) {
        if (problem == null || problem.getId() == null) {
            return;
        }

        String problemId = String.valueOf(problem.getId());
        if (isJudgeTestCaseCacheFresh(problemId)) {
            return;
        }

        try {
            List<?> existing = judgeGet(baseUrl + "/testcases/problem/" + problemId, List.class);
            if (existing != null && !existing.isEmpty()) {
                markJudgeTestCaseCache(problemId);
                return;
            }
        } catch (RestClientException ex) {
            log.debug("Unable to query judge testcases for problem {}: {}", problemId, ex.getMessage());
            return;
        }

        List<JudgeTestCasePayload> testCases = extractProblemTestCases(problem);
        if (testCases.isEmpty()) {
            return;
        }

        int created = 0;
        for (JudgeTestCasePayload testCase : testCases) {
            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("problemId", problemId);
                payload.put("inputData", testCase.inputData);
                payload.put("expectedOutput", testCase.expectedOutput);
                payload.put("hidden", testCase.hidden);
                judgePost(baseUrl + "/testcases", payload, Map.class);
                created++;
            } catch (RestClientException ex) {
                log.debug("Failed to sync judge testcase for problem {}: {}", problemId, ex.getMessage());
            }
        }

        if (created > 0) {
            log.info("Synced {} testcase(s) to judge for problem {}", created, problemId);
        }
        if (created > 0 || !testCases.isEmpty()) {
            markJudgeTestCaseCache(problemId);
        }
    }

    private boolean isJudgeTestCaseCacheFresh(String problemId) {
        Long lastSyncedAt = judgeTestCaseSyncCache.get(problemId);
        if (lastSyncedAt == null) {
            return false;
        }
        long ttlMs = Math.max(10_000L, judgeTestCaseCacheTtlMs);
        return System.currentTimeMillis() - lastSyncedAt < ttlMs;
    }

    private void markJudgeTestCaseCache(String problemId) {
        judgeTestCaseSyncCache.put(problemId, System.currentTimeMillis());
    }

    private List<JudgeTestCasePayload> extractProblemTestCases(Problem problem) {
        List<JudgeTestCasePayload> result = new ArrayList<>();

        String rawTestCases = problem.getTestCases();
        if (rawTestCases != null && !rawTestCases.isBlank() && objectMapper != null) {
            try {
                JsonNode root = objectMapper.readTree(rawTestCases);
                if (root.isArray()) {
                    for (JsonNode node : root) {
                        String input = firstNonBlank(
                                stringNode(node, "input"),
                                stringNode(node, "inputData"));
                        String output = firstNonBlank(
                                stringNode(node, "output"),
                                stringNode(node, "expectedOutput"));
                        if (input != null && output != null) {
                            result.add(new JudgeTestCasePayload(input, output, false));
                        }
                    }
                }
            } catch (Exception ex) {
                log.debug("Unable to parse testCases JSON for problem {}: {}", problem.getId(), ex.getMessage());
            }
        }

        if (!result.isEmpty()) {
            return result;
        }

        String sampleInput = firstNonBlank(problem.getSampleInput());
        String sampleOutput = firstNonBlank(problem.getSampleOutput());
        if (sampleInput != null && sampleOutput != null) {
            result.add(new JudgeTestCasePayload(sampleInput, sampleOutput, false));
        }

        return result;
    }

    private String stringNode(JsonNode node, String field) {
        if (node == null || field == null || field.isBlank()) {
            return null;
        }
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        return value.asText();
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String normalizeJudgeBaseUrl() {
        String trimmed = judgeUrl == null ? "" : judgeUrl.trim();
        if (trimmed.endsWith("/")) {
            return trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private String normalizeJudgeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return LANGUAGE_JAVA;
        }
        String normalized = language.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "java", "java8", "java11", "java17" -> "java";
            case "python", "python3", "py", "py3" -> "python";
            case "javascript", "js", "node", "nodejs" -> "javascript";
            case "cpp", "c++", "cxx", "g++" -> "cpp";
            case "c" -> "c";
            default -> normalized;
        };
    }

    private String resolveSubmitLane(Problem problem, Long userId) {
        if (problem == null || problem.getContest() == null || problem.getContest().getId() == null) {
            return QUEUE_LANE_SUBMIT;
        }

        long highPriorityWindowSeconds = Math.max(30L, judgeQueueHighPriorityWindowSeconds);
        LocalDateTime now = LocalDateTime.now();
        Long contestId = problem.getContest().getId();
        Contest contest = contestRepository.findById(contestId).orElse(null);
        if (isProblemSetContest(contest)) {
            return QUEUE_LANE_SUBMIT;
        }

        if (contest != null && contest.getEndTime() != null) {
            long contestRemaining = java.time.Duration.between(now, contest.getEndTime()).getSeconds();
            if (contestRemaining >= 0 && contestRemaining <= highPriorityWindowSeconds) {
                return QUEUE_LANE_HIGH;
            }
        }

        if (userId != null) {
            ContestParticipant participant = contestParticipantRepository.findByContestIdAndUserId(contestId, userId).orElse(null);
            if (participant != null && participant.getAttemptEndTime() != null) {
                long attemptRemaining = java.time.Duration.between(now, participant.getAttemptEndTime()).getSeconds();
                if (attemptRemaining >= 0 && attemptRemaining <= highPriorityWindowSeconds) {
                    return QUEUE_LANE_HIGH;
                }
            }
        }

        return QUEUE_LANE_SUBMIT;
    }

    private String normalizeQueueLane(String lane) {
        if (lane == null || lane.isBlank()) {
            return QUEUE_LANE_SUBMIT;
        }
        String normalized = lane.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case QUEUE_LANE_RUN -> QUEUE_LANE_RUN;
            case QUEUE_LANE_HIGH, "priority", "high-priority" -> QUEUE_LANE_HIGH;
            default -> QUEUE_LANE_SUBMIT;
        };
    }

    private boolean isLegacyInfrastructureFailure(ExecutionResult legacyResult) {
        if (legacyResult == null || !"RUNTIME_ERROR".equalsIgnoreCase(legacyResult.status)) {
            return false;
        }
        String output = legacyResult.output == null ? "" : legacyResult.output.toLowerCase(Locale.ROOT);
        return output.contains("judge execution service unavailable")
                || output.contains("service unavailable")
                || output.contains("connection refused")
                || output.contains("connect timed out")
                || output.contains("i/o error")
                || output.contains("failed to connect")
                || output.contains("unknown host")
                || output.contains("saturated")
                || output.contains("queue wait timeout")
                || output.contains("global concurrency limit");
    }

    private boolean isLikelyCompilationError(String normalizedError) {
        if (normalizedError == null || normalizedError.isBlank()) {
            return false;
        }
        return normalizedError.contains("compile")
                || normalizedError.contains("fatal error:")
                || normalizedError.contains("compilation terminated")
                || normalizedError.contains("cannot find symbol")
                || normalizedError.contains("undefined reference")
                || normalizedError.contains("javac")
                || normalizedError.contains("error: expected")
                || normalizedError.contains("syntax error");
    }

    private void sleepPollingInterval() {
        try {
            Thread.sleep(Math.max(judgePollIntervalMs, 100L));
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
        }
    }

    private int resolveJudgeExecutionTimeLimit(Problem problem) {
        int configured = problem != null && problem.getTimeLimitSeconds() != null && problem.getTimeLimitSeconds() > 0
                ? problem.getTimeLimitSeconds()
                : 2;
        int floor = Math.max(1, judgeExecutionTimeFloorSeconds);
        return Math.max(configured, floor);
    }

    private int resolveJudgeExecutionMemoryMb() {
        return Math.max(128, judgeExecutionMemoryMb);
    }

    private double resolveJudgeExecutionCpus() {
        if (judgeExecutionCpus <= 0) {
            return 1.0;
        }
        return judgeExecutionCpus;
    }

    private Integer toMillis(Object runtimeSecondsValue) {
        if (runtimeSecondsValue == null) {
            return 0;
        }

        try {
            if (runtimeSecondsValue instanceof Number number) {
                return (int) Math.max(0, Math.round(number.doubleValue() * 1000.0));
            }
            double parsed = Double.parseDouble(String.valueOf(runtimeSecondsValue));
            return (int) Math.max(0, Math.round(parsed * 1000.0));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private String extractJudgeOutput(Map<String, Object> statusResponse) {
        String details = stringValue(statusResponse.get("details"));
        String stderr = stringValue(statusResponse.get("stderr"));
        String stdout = stringValue(statusResponse.get("stdout"));

        if (details != null && !details.isBlank()) {
            return details;
        }
        if (stderr != null && !stderr.isBlank()) {
            return stderr;
        }
        return stdout == null ? "" : stdout;
    }

    private String extractJudgeOutput(JudgeResultEvent event) {
        if (event == null) {
            return "";
        }
        String details = event.getDetails();
        if (details != null && !details.isBlank()) {
            return details;
        }
        String stderr = event.getStderr();
        if (stderr != null && !stderr.isBlank()) {
            return stderr;
        }
        String stdout = event.getStdout();
        return stdout == null ? "" : stdout;
    }

    private ExecutionResult mapJudgeTerminalStatus(String judgeStatus, String output, Integer executionTimeMs) {
        String normalized = judgeStatus.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "ACCEPTED" -> new ExecutionResult("ACCEPTED", output, executionTimeMs);
            case "TIME_LIMIT", "TIMEOUT" -> new ExecutionResult("TIME_LIMIT", output, executionTimeMs);
            case "COMPILE_ERROR" -> new ExecutionResult("COMPILE_ERROR", output, executionTimeMs);
            case "RUNTIME_ERROR", "ERROR" -> new ExecutionResult("RUNTIME_ERROR", output, executionTimeMs);
            case "FAILED" -> new ExecutionResult("WRONG_ANSWER", output, executionTimeMs);
            default -> new ExecutionResult("RUNTIME_ERROR", "Unknown judge status: " + judgeStatus, executionTimeMs);
        };
    }

    @Scheduled(fixedDelayString = "${judge.queue.retry-interval-ms:5000}")
    @Transactional
    public void processQueuedSubmissions() {
        if (isJudgeCircuitOpen()) {
            return;
        }

        int batchSize = Math.max(5, judgeQueueRetryBatchSize);
        List<Submission> queuedSubmissions = submissionRepository.findByStatusOrderBySubmittedAtAsc(
                STATUS_QUEUED,
                PageRequest.of(0, batchSize));
        for (Submission queuedSubmission : queuedSubmissions) {
            try {
                ExecutionResult executionResult;
                String judgeSubmissionId = queuedSubmission.getJudgeSubmissionId();
                if (judgeSubmissionId != null && !judgeSubmissionId.isBlank()) {
                    if (!judgeQueuePollLegacyStatusEnabled || judgeResultConsumerEnabled) {
                        continue;
                    }
                    executionResult = pollAsyncJudgeStatus(normalizeJudgeBaseUrl(), judgeSubmissionId);
                    if (executionResult == null) {
                        continue;
                    }
                } else {
                    executionResult = evaluateAgainstSample(
                            queuedSubmission.getProblem(),
                            queuedSubmission.getCode(),
                            queuedSubmission.getLanguage());
                }

                if (STATUS_JUDGE_UNAVAILABLE.equalsIgnoreCase(executionResult.status)) {
                    queuedSubmission.setOutput(executionResult.output);
                    submissionRepository.save(queuedSubmission);
                    continue;
                }

                Submission finalized = finalizeSubmission(queuedSubmission, executionResult);
                log.info("Queued submission {} finalized with status {}", finalized.getId(), finalized.getStatus());
            } catch (Exception ex) {
                log.warn("Failed to process queued submission {}: {}", queuedSubmission.getId(), ex.getMessage());
            }
        }
    }

    @Transactional
    public boolean applyJudgeResultEvent(JudgeResultEvent event) {
        if (event == null || event.getJudgeSubmissionId() == null || event.getJudgeSubmissionId().isBlank()) {
            return false;
        }

        Submission submission = submissionRepository.findFirstByJudgeSubmissionId(event.getJudgeSubmissionId().trim())
                .orElse(null);
        if (submission == null || submission.getJudgeSubmissionId() == null || submission.getJudgeSubmissionId().isBlank()) {
            return false;
        }

        String currentStatus = submission.getStatus() == null ? "" : submission.getStatus().trim();
        boolean terminalAlready = !(STATUS_QUEUED.equalsIgnoreCase(currentStatus)
                || STATUS_PENDING.equalsIgnoreCase(currentStatus)
                || STATUS_RUNNING.equalsIgnoreCase(currentStatus));
        if (terminalAlready) {
            return false;
        }

        String judgeStatus = event.getStatus() == null ? "" : event.getStatus().trim();
        if (judgeStatus.isBlank()) {
            return false;
        }
        if (STATUS_PENDING.equalsIgnoreCase(judgeStatus) || STATUS_RUNNING.equalsIgnoreCase(judgeStatus)) {
            submission.setStatus(judgeStatus.toUpperCase(Locale.ROOT));
            submission.setOutput(ASYNC_QUEUED_OUTPUT_MESSAGE);
            Submission saved = submissionRepository.save(submission);
            broadcastSubmissionStatusUpdate(saved);
            return true;
        }

        Integer executionTime = toMillis(event.getRuntimeSeconds());
        String output = extractJudgeOutput(event);
        ExecutionResult executionResult = mapJudgeTerminalStatus(judgeStatus, output, executionTime);
        finalizeSubmission(submission, executionResult);
        return true;
    }

    private Submission finalizeSubmission(Submission submission, ExecutionResult executionResult) {
        submission.setStatus(executionResult.status);
        submission.setOutput(executionResult.output);
        submission.setExecutionTime(executionResult.executionTime);
        submission.setJudgeSubmissionId(null);
        Submission finalSaved = submissionRepository.save(submission);
        applyPostJudgeEffects(finalSaved);
        broadcastSubmissionStatusUpdate(finalSaved);
        return finalSaved;
    }

    private void applyPostJudgeEffects(Submission finalSaved) {
        try {
            if ("ACCEPTED".equalsIgnoreCase(finalSaved.getStatus())) {
                duelService.handleAcceptedSubmission(finalSaved);
                broadcastLeaderboardUpdate(finalSaved);
            }
        } catch (Exception ex) {
            // avoid failing primary submission flow due to duel update errors
        }

        // process sudden-death elimination if this problem belongs to a contest in
        // SUDDEN_DEATH mode
        try {
            if (finalSaved.getProblem() != null && finalSaved.getProblem().getContest() != null) {
                Contest contest = finalSaved.getProblem().getContest();
                if (isProblemSetContest(contest)) {
                    return;
                }
                Long contestId = contest.getId();
                boolean correct = "ACCEPTED".equalsIgnoreCase(finalSaved.getStatus());
                suddenDeathService.processSubmission(contestId, finalSaved.getUser().getId(), correct);

                // award comeback bonus on correct submissions
                try {
                    if (correct) {
                        comebackBonusService.calculateAndAwardBonus(finalSaved.getUser().getId(),
                                finalSaved.getProblem().getId(), contestId, finalSaved.getId());
                    }
                } catch (Exception ex) {
                    // ignore bonus errors
                }

                // handle speed mode scoring
                try {
                    if (correct) {
                        speedCodingService.calculateSpeedScore(contestId, finalSaved.getUser().getId(),
                                finalSaved.getProblem().getId(), finalSaved.getId());
                    }
                } catch (Exception ex) {
                    // ignore speed scoring errors
                }

                // update accuracy mode scoring (apply for both correct and incorrect
                // submissions)
                try {
                    accuracyModeService.updateAccuracyScore(contestId, finalSaved.getUser().getId(),
                            finalSaved.getProblem().getId(), correct, finalSaved.getId());
                } catch (Exception ex) {
                    // ignore accuracy scoring errors
                }
            }
        } catch (Exception ex) {
            // don't fail the submission flow if sudden death processing errors
        }
    }

    private ExecutionResult unavailableExecutionResult(String transportError) {
        String output = QUEUED_OUTPUT_MESSAGE;
        if (transportError != null && !transportError.isBlank()) {
            output = output + " Last error: " + transportError;
        }
        return new ExecutionResult(STATUS_JUDGE_UNAVAILABLE, output, 0);
    }

    private void sleepRetryDelay() {
        try {
            Thread.sleep(Math.max(judgeRetryDelayMs, 50L));
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
        }
    }

    private boolean isJudgeCircuitOpen() {
        return circuitOpenUntilMs > System.currentTimeMillis();
    }

    private void recordJudgeSuccess() {
        synchronized (circuitLock) {
            consecutiveJudgeFailures = 0;
            circuitOpenUntilMs = 0L;
        }
    }

    private void recordJudgeFailure() {
        synchronized (circuitLock) {
            consecutiveJudgeFailures++;
            if (consecutiveJudgeFailures >= Math.max(1, judgeCircuitFailureThreshold)) {
                consecutiveJudgeFailures = 0;
                circuitOpenUntilMs = System.currentTimeMillis() + Math.max(judgeCircuitOpenMs, 1000L);
                log.warn("Judge circuit opened for {} ms", judgeCircuitOpenMs);
            }
        }
    }

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        return String.valueOf(value);
    }

    private <T> T judgePost(String url, Object body, Class<T> responseType) {
        HttpEntity<Object> request = new HttpEntity<>(body, buildJudgeHeaders());
        ResponseEntity<T> response = restTemplate.exchange(url, HttpMethod.POST, request, responseType);
        return response.getBody();
    }

    private <T> T judgeGet(String url, Class<T> responseType) {
        HttpEntity<Void> request = new HttpEntity<>(buildJudgeHeaders());
        ResponseEntity<T> response = restTemplate.exchange(url, HttpMethod.GET, request, responseType);
        return response.getBody();
    }

    private HttpHeaders buildJudgeHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set("X-Judge-Token", judgeAuthToken);
        return headers;
    }

    private void broadcastLeaderboardUpdate(Submission submission) {
        if (cacheManager != null) {
            Cache leaderboardCache = cacheManager.getCache("leaderboardGlobalFiltered");
            if (leaderboardCache != null) {
                leaderboardCache.clear();
            }
        }

        if (messagingTemplate == null) {
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "HIGH_SCORE_UPDATE");
        payload.put("scope", "leaderboard");
        payload.put("userId", submission.getUser().getId());
        payload.put("submittedAt", submission.getSubmittedAt());
        if (submission.getProblem() != null && submission.getProblem().getContest() != null) {
            payload.put("contestId", submission.getProblem().getContest().getId());
        }

        messagingTemplate.convertAndSend("/topic/leaderboard/updates", payload);
    }

    private void broadcastSubmissionStatusUpdate(Submission submission) {
        if (messagingTemplate == null || submission == null || submission.getUser() == null || submission.getUser().getId() == null) {
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "SUBMISSION_STATUS_UPDATE");
        payload.put("submissionId", submission.getId());
        payload.put("userId", submission.getUser().getId());
        payload.put("status", submission.getStatus());
        payload.put("judgeSubmissionId", submission.getJudgeSubmissionId());
        payload.put("submittedAt", submission.getSubmittedAt());
        if (submission.getProblem() != null) {
            payload.put("problemId", submission.getProblem().getId());
        }

        messagingTemplate.convertAndSend("/topic/submissions/user/" + submission.getUser().getId(), payload);
    }
}
