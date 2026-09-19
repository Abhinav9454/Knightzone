package com.collegecontest.judge.mq;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class SubmissionProducer {
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SubmissionProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendSubmission(String submissionId) {
        sendSubmission(submissionId, "submit");
    }

    public void sendSubmission(String submissionId, String queueLane) {
        String routing = resolveRoutingKey(queueLane);
        rabbitTemplate.convertAndSend(RabbitConfig.SUBMISSION_EXCHANGE, routing, submissionId);
    }

    public void sendToDeadLetter(String submissionId) {
        rabbitTemplate.convertAndSend(RabbitConfig.SUBMISSION_DLX, RabbitConfig.SUBMISSION_DLQ_ROUTING, submissionId);
    }

    public void sendResult(JudgeResultEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(RabbitConfig.SUBMISSION_RESULT_EXCHANGE, RabbitConfig.SUBMISSION_RESULT_ROUTING, payload);
        } catch (Exception ignored) {
            // Intentionally swallowed to avoid blocking judge worker completion.
        }
    }

    private String resolveRoutingKey(String queueLane) {
        if (queueLane == null) {
            return RabbitConfig.SUBMISSION_ROUTING_SUBMIT;
        }
        return switch (queueLane.trim().toLowerCase()) {
            case "run" -> RabbitConfig.SUBMISSION_ROUTING_RUN;
            case "high", "priority", "high-priority" -> RabbitConfig.SUBMISSION_ROUTING_HIGH;
            default -> RabbitConfig.SUBMISSION_ROUTING_SUBMIT;
        };
    }
}
