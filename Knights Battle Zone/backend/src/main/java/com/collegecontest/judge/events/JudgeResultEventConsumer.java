package com.collegecontest.judge.events;

import com.collegecontest.service.SubmissionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "judge.events.result-consumer-enabled", havingValue = "true", matchIfMissing = true)
public class JudgeResultEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(JudgeResultEventConsumer.class);

    private final SubmissionService submissionService;
    private final ObjectMapper objectMapper;

    public JudgeResultEventConsumer(SubmissionService submissionService, @Autowired(required = false) ObjectMapper objectMapper) {
        this.submissionService = submissionService;
        this.objectMapper = objectMapper == null ? new ObjectMapper() : objectMapper;
    }

    @RabbitListener(
            queues = "${judge.events.result-queue:submission.result.queue}",
            concurrency = "${judge.events.result-listener-concurrency:2-8}")
    public void consumeResultEvent(String message) {
        if (message == null || message.isBlank()) {
            return;
        }
        try {
            JudgeResultEvent event = objectMapper.readValue(message, JudgeResultEvent.class);
            boolean handled = submissionService.applyJudgeResultEvent(event);
            if (!handled) {
                log.debug("Judge result event ignored (submission not found/terminal): {}", event.getJudgeSubmissionId());
            }
        } catch (Exception ex) {
            log.warn("Failed to process judge result event payload: {}", ex.getMessage());
        }
    }
}
