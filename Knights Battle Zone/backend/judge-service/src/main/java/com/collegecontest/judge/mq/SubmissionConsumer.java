package com.collegecontest.judge.mq;

import com.collegecontest.judge.dto.SubmissionRequest;
import com.collegecontest.judge.dto.SubmissionResult;
import com.collegecontest.judge.model.Submission;
import com.collegecontest.judge.repo.SubmissionRepository;
import com.collegecontest.judge.repo.TestCaseRepository;
import com.collegecontest.judge.model.TestCase;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.collegecontest.judge.service.DockerExecutionService;
import com.collegecontest.judge.service.JudgeStatusResolver;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PreDestroy;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.ImmediateRequeueAmqpException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class SubmissionConsumer {
    private static final Logger log = LoggerFactory.getLogger(SubmissionConsumer.class);

    private final SubmissionRepository repo;
    private final TestCaseRepository testCaseRepo;
    private final DockerExecutionService docker;
    private final JudgeStatusResolver statusResolver;
    private final SimpMessagingTemplate messaging;
    private final SubmissionProducer producer;
    private final ObjectMapper mapper = new ObjectMapper();
    private final com.collegecontest.judge.cache.CacheService cacheService;
    @Autowired(required = false)
    private MeterRegistry meterRegistry;
    @Value("${judge.queue.max-retries:4}")
    private int judgeQueueMaxRetries;
    @Value("${judge.execution.stop-on-first-failure:true}")
    private boolean stopOnFirstFailure;
    @Value("${judge.execution.batch-for-submit-enabled:true}")
    private boolean batchForSubmitEnabled;
    @Value("${judge.execution.batch-min-testcases:2}")
    private int batchMinTestcases;
    @Value("${judge.shutdown.drain-timeout-seconds:25}")
    private int shutdownDrainTimeoutSeconds;
    @Value("${judge.shutdown.drain-poll-ms:200}")
    private long shutdownDrainPollMs;
    private final AtomicBoolean shuttingDown = new AtomicBoolean(false);
    private final AtomicInteger activeMessages = new AtomicInteger(0);

    public SubmissionConsumer(SubmissionRepository repo, TestCaseRepository testCaseRepo,
            DockerExecutionService docker, JudgeStatusResolver statusResolver, SimpMessagingTemplate messaging,
            SubmissionProducer producer,
            com.collegecontest.judge.cache.CacheService cacheService) {
        this.repo = repo;
        this.testCaseRepo = testCaseRepo;
        this.docker = docker;
        this.statusResolver = statusResolver;
        this.messaging = messaging;
        this.producer = producer;
        this.cacheService = cacheService;
    }

    @RabbitListener(
            queues = RabbitConfig.SUBMISSION_QUEUE_SUBMIT,
            concurrency = "${judge.queue.submit-listener-concurrency:2-6}")
    public void handleSubmitMessage(String submissionId,
                                    @Header(name = "x-death", required = false) List<Map<String, Object>> xDeath) {
        processMessage(submissionId, xDeath, RabbitConfig.SUBMISSION_QUEUE_SUBMIT, "submit");
    }

    @RabbitListener(
            queues = RabbitConfig.SUBMISSION_QUEUE_RUN,
            concurrency = "${judge.queue.run-listener-concurrency:2-4}")
    public void handleRunMessage(String submissionId,
                                 @Header(name = "x-death", required = false) List<Map<String, Object>> xDeath) {
        processMessage(submissionId, xDeath, RabbitConfig.SUBMISSION_QUEUE_RUN, "run");
    }

    @RabbitListener(
            queues = RabbitConfig.SUBMISSION_QUEUE_HIGH,
            concurrency = "${judge.queue.high-listener-concurrency:2-8}")
    public void handleHighPriorityMessage(String submissionId,
                                          @Header(name = "x-death", required = false) List<Map<String, Object>> xDeath) {
        processMessage(submissionId, xDeath, RabbitConfig.SUBMISSION_QUEUE_HIGH, "high");
    }

    private void processMessage(String submissionId,
                                List<Map<String, Object>> xDeath,
                                String sourceQueue,
                                String lane) {
        if (shuttingDown.get()) {
            throw new ImmediateRequeueAmqpException("Judge consumer is shutting down, requeueing message.");
        }
        activeMessages.incrementAndGet();
        log.info("Processing submission {}", submissionId);
        Submission s = null;
        long startedNanos = System.nanoTime();
        try {
            s = repo.findById(submissionId).orElse(null);
            if (s == null) {
                log.warn("Submission {} not found", submissionId);
                return;
            }

            s.setStatus("RUNNING");
            s.setUpdatedAt(Instant.now());
            repo.save(s);
            notifyFrontend(s);
            publishResultEvent(s);

            // fetch testcases for problem
            if (s.getProblemId() == null) {
                log.warn("Submission {} has no problemId", submissionId);
                s.setStatus("ERROR");
                s.setUpdatedAt(Instant.now());
                repo.save(s);
                notifyFrontend(s);
                publishResultEvent(s);
                return;
            }

            var tests = testCaseRepo.findByProblemId(String.valueOf(s.getProblemId()));
            if (tests == null || tests.isEmpty()) {
                log.warn("No testcases for problem {}", s.getProblemId());
                s.setStatus("ERROR");
                s.setUpdatedAt(Instant.now());
                repo.save(s);
                notifyFrontend(s);
                publishResultEvent(s);
                return;
            }

            // check cache for identical submission
            String cached = cacheService.getCached(String.valueOf(s.getProblemId()), s.getLanguage(), s.getCode());
            if (cached != null) {
                // cached payload is the stored submission JSON (details + verdict fields)
                try {
                    var node = mapper.readTree(cached);
                    s.setDetails(node.has("details") ? node.get("details").toString() : null);
                    s.setExitCode(node.has("exitCode") ? node.get("exitCode").asInt() : null);
                    s.setRuntimeSeconds(node.has("runtimeSeconds") ? node.get("runtimeSeconds").asDouble() : null);
                    s.setPeakMemoryBytes(node.has("peakMemoryBytes") ? node.get("peakMemoryBytes").asLong() : null);
                    s.setStatus(node.has("status") ? node.get("status").asText() : "UNKNOWN");
                    s.setUpdatedAt(Instant.now());
                    repo.save(s);
                    notifyFrontend(s);
                    publishResultEvent(s);
                    return;
                } catch (Exception e) {
                    log.warn("Failed to read cache for {}", s.getId(), e);
                }
            }

            EvaluationAggregate aggregate = evaluateSubmission(s, tests);

            s.setStdout(null);
            s.setStderr(null);
            s.setExitCode("ACCEPTED".equals(aggregate.finalStatus) ? 0 : 1);
            s.setRuntimeSeconds(aggregate.totalRuntime);
            s.setPeakMemoryBytes(aggregate.peakMemory);
            s.setStatus(aggregate.finalStatus);
            String detailsJson = mapper.writeValueAsString(aggregate.detailsArray);
            s.setDetails(detailsJson);
            s.setUpdatedAt(Instant.now());
            repo.save(s);
            // cache this result for identical submissions (TTL 24h)
            try {
                ObjectNode cacheNode = mapper.createObjectNode();
                cacheNode.put("status", s.getStatus());
                cacheNode.put("exitCode", s.getExitCode() == null ? -1 : s.getExitCode());
                cacheNode.put("runtimeSeconds", s.getRuntimeSeconds() == null ? 0.0 : s.getRuntimeSeconds());
                cacheNode.put("peakMemoryBytes", s.getPeakMemoryBytes() == null ? 0L : s.getPeakMemoryBytes());
                cacheNode.set("details", mapper.readTree(detailsJson));
                cacheService.putCached(String.valueOf(s.getProblemId()), s.getLanguage(), s.getCode(),
                        cacheNode.toString(), 24 * 3600);
            } catch (Exception ignored) {
            }
            notifyFrontend(s);
            publishResultEvent(s);
        } catch (Exception e) {
            if (s == null) {
                throw new ImmediateRequeueAmqpException("Submission lookup failed during shutdown-safe handling.", e);
            }
            long retryCount = extractDeadLetterCount(xDeath, sourceQueue);
            if (retryCount >= Math.max(1, judgeQueueMaxRetries)) {
                log.error("Execution error for {} after {} retries. Moving to DLQ.", submissionId, retryCount, e);
                s.setStatus("ERROR");
                s.setStderr("Retry limit reached. Last error: " + e.getMessage());
                s.setUpdatedAt(Instant.now());
                repo.save(s);
                notifyFrontend(s);
                publishResultEvent(s);
                producer.sendToDeadLetter(submissionId);
            } else {
                log.warn("Execution error for {}. Scheduling retry {}/{}", submissionId, retryCount + 1, judgeQueueMaxRetries, e);
                s.setStatus("PENDING");
                s.setStderr(e.getMessage());
                s.setUpdatedAt(Instant.now());
                repo.save(s);
                notifyFrontend(s);
                publishResultEvent(s);
                throw new AmqpRejectAndDontRequeueException("Retrying submission " + submissionId, e);
            }
        }
        finally {
            String finalStatus = s == null ? "UNKNOWN" : s.getStatus();
            recordMetrics(finalStatus, startedNanos, lane);
            activeMessages.decrementAndGet();
        }
    }

    @PreDestroy
    public void prepareForShutdown() {
        shuttingDown.set(true);
        long timeoutMs = Math.max(1000L, shutdownDrainTimeoutSeconds * 1000L);
        long pollMs = Math.max(50L, shutdownDrainPollMs);
        long deadline = System.currentTimeMillis() + timeoutMs;

        while (activeMessages.get() > 0 && System.currentTimeMillis() < deadline) {
            try {
                TimeUnit.MILLISECONDS.sleep(pollMs);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        if (activeMessages.get() > 0) {
            log.warn("Judge consumer shutdown timeout reached with {} active message(s).", activeMessages.get());
        } else {
            log.info("Judge consumer drained successfully before shutdown.");
        }
    }

    private long extractDeadLetterCount(List<Map<String, Object>> xDeath, String sourceQueue) {
        if (xDeath == null || xDeath.isEmpty()) {
            return 0L;
        }
        long count = 0L;
        for (Map<String, Object> death : xDeath) {
            Object queue = death.get("queue");
            Object value = death.get("count");
            if (value instanceof Number number) {
                long current = number.longValue();
                if (queue == null || sourceQueue.equals(String.valueOf(queue))) {
                    count = Math.max(count, current);
                }
            }
        }
        return count;
    }

    private void notifyFrontend(Submission s) {
        try {
            messaging.convertAndSend("/topic/submission/" + s.getId(), s);
        } catch (Exception ignored) {
        }
    }

    private void publishResultEvent(Submission submission) {
        if (submission == null || submission.getId() == null) {
            return;
        }
        JudgeResultEvent event = new JudgeResultEvent();
        event.setJudgeSubmissionId(submission.getId());
        event.setStatus(submission.getStatus());
        event.setDetails(submission.getDetails());
        event.setStdout(submission.getStdout());
        event.setStderr(submission.getStderr());
        event.setRuntimeSeconds(submission.getRuntimeSeconds());
        event.setPeakMemoryBytes(submission.getPeakMemoryBytes());
        event.setExitCode(submission.getExitCode());
        producer.sendResult(event);
    }

    private void recordMetrics(String status, long startedNanos, String lane) {
        if (meterRegistry == null) {
            return;
        }
        long elapsedNanos = System.nanoTime() - startedNanos;
        String laneTag = normalizeLane(lane);
        meterRegistry.timer("judge.queue.submission.duration", "status", normalizeStatus(status), "lane", laneTag)
                .record(elapsedNanos, java.util.concurrent.TimeUnit.NANOSECONDS);
        meterRegistry.counter("judge.queue.submission.processed", "status", normalizeStatus(status), "lane", laneTag).increment();
        if ("ERROR".equalsIgnoreCase(status)) {
            meterRegistry.counter("judge.queue.submission.failures", "lane", laneTag).increment();
        }
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "UNKNOWN";
        }
        return status;
    }

    private String normalizeLane(String lane) {
        if (lane == null || lane.isBlank()) {
            return "submit";
        }
        return lane;
    }

    private EvaluationAggregate evaluateSubmission(Submission submission, List<TestCase> tests) throws Exception {
        if (shouldUseBatchExecution(tests)) {
            return evaluateSubmissionBatch(submission, tests);
        }
        return evaluateSubmissionSequentially(submission, tests);
    }

    private boolean shouldUseBatchExecution(List<TestCase> tests) {
        int threshold = Math.max(2, batchMinTestcases);
        return batchForSubmitEnabled && tests != null && tests.size() >= threshold;
    }

    private EvaluationAggregate evaluateSubmissionBatch(Submission submission, List<TestCase> tests) throws Exception {
        EvaluationAggregate aggregate = new EvaluationAggregate(mapper.createArrayNode());
        SubmissionRequest req = buildExecutionRequest(submission, null);

        java.util.ArrayList<String> stdins = new java.util.ArrayList<>(tests.size());
        for (TestCase testCase : tests) {
            stdins.add(testCase.getInputData() == null ? "" : testCase.getInputData());
        }

        List<SubmissionResult> results = docker.executeBatch(req, stdins);
        if (results == null || results.isEmpty()) {
            throw new IllegalStateException("Judge batch execution returned empty result set.");
        }

        int processed = Math.min(tests.size(), results.size());
        for (int index = 0; index < processed; index++) {
            applyTestCaseResult(aggregate, tests.get(index), results.get(index));
            if (stopOnFirstFailure && !"ACCEPTED".equals(aggregate.finalStatus)) {
                break;
            }
        }

        if (processed < tests.size()) {
            aggregate.finalStatus = statusResolver.prioritizeStatus(aggregate.finalStatus, "RUNTIME_ERROR");
        }
        return aggregate;
    }

    private EvaluationAggregate evaluateSubmissionSequentially(Submission submission, List<TestCase> tests) throws Exception {
        EvaluationAggregate aggregate = new EvaluationAggregate(mapper.createArrayNode());
        for (TestCase testCase : tests) {
            SubmissionRequest req = buildExecutionRequest(submission, testCase.getInputData());

            SubmissionResult result = docker.execute(req);
            applyTestCaseResult(aggregate, testCase, result);
            if (stopOnFirstFailure && !"ACCEPTED".equals(aggregate.finalStatus)) {
                break;
            }
        }
        return aggregate;
    }

    private void applyTestCaseResult(EvaluationAggregate aggregate, TestCase testCase, SubmissionResult rawResult) {
        SubmissionResult result = rawResult == null ? syntheticRuntimeFailure("Missing judge result.") : rawResult;
        String executionStatus = statusResolver.normalizeExecutionStatus(result.getStatus());
        String expected = testCase.getExpectedOutput() == null ? "" : testCase.getExpectedOutput().trim();
        String out = result.getStdout() == null ? "" : result.getStdout().trim();
        boolean passed = expected.equals(out) && result.getExitCode() == 0;

        if (!"ACCEPTED".equals(executionStatus)) {
            aggregate.finalStatus = statusResolver.prioritizeStatus(aggregate.finalStatus, executionStatus);
        } else if (!passed) {
            aggregate.finalStatus = statusResolver.prioritizeStatus(aggregate.finalStatus, "FAILED");
        }

        double runtime = result.getRuntimeSeconds();
        if (!Double.isFinite(runtime) || runtime < 0) {
            runtime = 0.0;
        }
        aggregate.totalRuntime += runtime;
        aggregate.peakMemory = Math.max(aggregate.peakMemory, Math.max(0L, result.getPeakMemoryBytes()));

        if (!testCase.isHidden()) {
            ObjectNode testNode = mapper.createObjectNode();
            testNode.put("testId", testCase.getId());
            testNode.put("passed", passed);
            testNode.put("status", executionStatus);
            testNode.put("exitCode", result.getExitCode());
            testNode.put("runtimeSeconds", runtime);
            testNode.put("peakMemoryBytes", Math.max(0L, result.getPeakMemoryBytes()));
            testNode.put("stdout", result.getStdout() == null ? "" : result.getStdout());
            testNode.put("stderr", result.getStderr() == null ? "" : result.getStderr());
            testNode.put("expected", testCase.getExpectedOutput() == null ? "" : testCase.getExpectedOutput());
            aggregate.detailsArray.add(testNode);
        }
    }

    private SubmissionResult syntheticRuntimeFailure(String message) {
        SubmissionResult failure = new SubmissionResult();
        failure.setStatus("RUNTIME_ERROR");
        failure.setExitCode(1);
        failure.setStdout("");
        failure.setStderr(message == null ? "Unknown judge error" : message);
        failure.setRuntimeSeconds(0.0);
        failure.setPeakMemoryBytes(0L);
        return failure;
    }

    private SubmissionRequest buildExecutionRequest(Submission submission, String stdin) {
        SubmissionRequest request = new SubmissionRequest();
        request.setLanguage(submission.getLanguage());
        request.setCode(submission.getCode());
        request.setProblemId(submission.getProblemId() == null ? null : String.valueOf(submission.getProblemId()));
        request.setStdin(stdin);
        request.setTimeLimitSeconds(normalizePositiveInt(submission.getTimeLimitSeconds(), request.getTimeLimitSeconds()));
        request.setMemoryMb(normalizePositiveInt(submission.getMemoryMb(), request.getMemoryMb()));
        request.setCpus(normalizePositiveDouble(submission.getCpus(), request.getCpus()));
        return request;
    }

    private int normalizePositiveInt(Integer value, int fallback) {
        if (value == null || value <= 0) {
            return fallback;
        }
        return value;
    }

    private double normalizePositiveDouble(Double value, double fallback) {
        if (value == null || value <= 0) {
            return fallback;
        }
        return value;
    }

    private static final class EvaluationAggregate {
        private String finalStatus = "ACCEPTED";
        private double totalRuntime = 0.0;
        private long peakMemory = 0L;
        private final ArrayNode detailsArray;

        private EvaluationAggregate(ArrayNode detailsArray) {
            this.detailsArray = detailsArray;
        }
    }
}
