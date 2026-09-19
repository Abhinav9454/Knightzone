package com.collegecontest.judge.mq;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class RabbitConfig {
    public static final String SUBMISSION_QUEUE = "submission.queue.submit";
    public static final String SUBMISSION_QUEUE_SUBMIT = SUBMISSION_QUEUE;
    public static final String SUBMISSION_QUEUE_RUN = "submission.queue.run";
    public static final String SUBMISSION_QUEUE_HIGH = "submission.queue.high";
    public static final String SUBMISSION_EXCHANGE = "submission.exchange";
    public static final String SUBMISSION_ROUTING = "submission.routing.submit";
    public static final String SUBMISSION_ROUTING_SUBMIT = SUBMISSION_ROUTING;
    public static final String SUBMISSION_ROUTING_RUN = "submission.routing.run";
    public static final String SUBMISSION_ROUTING_HIGH = "submission.routing.high";
    public static final String SUBMISSION_DLX = "submission.dlx";
    public static final String SUBMISSION_RETRY_QUEUE = "submission.retry.queue.submit";
    public static final String SUBMISSION_RETRY_QUEUE_SUBMIT = SUBMISSION_RETRY_QUEUE;
    public static final String SUBMISSION_RETRY_QUEUE_RUN = "submission.retry.queue.run";
    public static final String SUBMISSION_RETRY_QUEUE_HIGH = "submission.retry.queue.high";
    public static final String SUBMISSION_RETRY_ROUTING = "submission.retry.submit";
    public static final String SUBMISSION_RETRY_ROUTING_SUBMIT = SUBMISSION_RETRY_ROUTING;
    public static final String SUBMISSION_RETRY_ROUTING_RUN = "submission.retry.run";
    public static final String SUBMISSION_RETRY_ROUTING_HIGH = "submission.retry.high";
    public static final String SUBMISSION_DLQ = "submission.dlq";
    public static final String SUBMISSION_DLQ_ROUTING = "submission.dead";
    public static final String SUBMISSION_RESULT_EXCHANGE = "submission.result.exchange";
    public static final String SUBMISSION_RESULT_QUEUE = "submission.result.queue";
    public static final String SUBMISSION_RESULT_ROUTING = "submission.result.routing";

    @Value("${judge.queue.retry-delay-ms:5000}")
    private long retryDelayMs;

    @Bean
    public Queue submissionQueue() {
        return new Queue(SUBMISSION_QUEUE_SUBMIT, true, false, false, Map.of(
                "x-dead-letter-exchange", SUBMISSION_DLX,
                "x-dead-letter-routing-key", SUBMISSION_RETRY_ROUTING_SUBMIT));
    }

    @Bean
    public Queue submissionRunQueue() {
        return new Queue(SUBMISSION_QUEUE_RUN, true, false, false, Map.of(
                "x-dead-letter-exchange", SUBMISSION_DLX,
                "x-dead-letter-routing-key", SUBMISSION_RETRY_ROUTING_RUN));
    }

    @Bean
    public Queue submissionHighQueue() {
        return new Queue(SUBMISSION_QUEUE_HIGH, true, false, false, Map.of(
                "x-dead-letter-exchange", SUBMISSION_DLX,
                "x-dead-letter-routing-key", SUBMISSION_RETRY_ROUTING_HIGH));
    }

    @Bean
    public TopicExchange submissionExchange() {
        return new TopicExchange(SUBMISSION_EXCHANGE);
    }

    @Bean
    public TopicExchange submissionDeadLetterExchange() {
        return new TopicExchange(SUBMISSION_DLX);
    }

    @Bean
    public Queue submissionRetryQueue() {
        return new Queue(SUBMISSION_RETRY_QUEUE_SUBMIT, true, false, false, Map.of(
                "x-message-ttl", Math.max(1000L, retryDelayMs),
                "x-dead-letter-exchange", SUBMISSION_EXCHANGE,
                "x-dead-letter-routing-key", SUBMISSION_ROUTING_SUBMIT));
    }

    @Bean
    public Queue submissionRunRetryQueue() {
        return new Queue(SUBMISSION_RETRY_QUEUE_RUN, true, false, false, Map.of(
                "x-message-ttl", Math.max(1000L, retryDelayMs),
                "x-dead-letter-exchange", SUBMISSION_EXCHANGE,
                "x-dead-letter-routing-key", SUBMISSION_ROUTING_RUN));
    }

    @Bean
    public Queue submissionHighRetryQueue() {
        return new Queue(SUBMISSION_RETRY_QUEUE_HIGH, true, false, false, Map.of(
                "x-message-ttl", Math.max(1000L, retryDelayMs),
                "x-dead-letter-exchange", SUBMISSION_EXCHANGE,
                "x-dead-letter-routing-key", SUBMISSION_ROUTING_HIGH));
    }

    @Bean
    public Queue submissionDlq() {
        return new Queue(SUBMISSION_DLQ, true);
    }

    @Bean
    public Binding submissionBinding(Queue submissionQueue, TopicExchange submissionExchange) {
        return BindingBuilder.bind(submissionQueue).to(submissionExchange).with(SUBMISSION_ROUTING_SUBMIT);
    }

    @Bean
    public Binding submissionRetryBinding(Queue submissionRetryQueue, TopicExchange submissionDeadLetterExchange) {
        return BindingBuilder.bind(submissionRetryQueue).to(submissionDeadLetterExchange).with(SUBMISSION_RETRY_ROUTING_SUBMIT);
    }

    @Bean
    public Binding submissionRunBinding(Queue submissionRunQueue, TopicExchange submissionExchange) {
        return BindingBuilder.bind(submissionRunQueue).to(submissionExchange).with(SUBMISSION_ROUTING_RUN);
    }

    @Bean
    public Binding submissionRunRetryBinding(Queue submissionRunRetryQueue, TopicExchange submissionDeadLetterExchange) {
        return BindingBuilder.bind(submissionRunRetryQueue).to(submissionDeadLetterExchange).with(SUBMISSION_RETRY_ROUTING_RUN);
    }

    @Bean
    public Binding submissionHighBinding(Queue submissionHighQueue, TopicExchange submissionExchange) {
        return BindingBuilder.bind(submissionHighQueue).to(submissionExchange).with(SUBMISSION_ROUTING_HIGH);
    }

    @Bean
    public Binding submissionHighRetryBinding(Queue submissionHighRetryQueue, TopicExchange submissionDeadLetterExchange) {
        return BindingBuilder.bind(submissionHighRetryQueue).to(submissionDeadLetterExchange).with(SUBMISSION_RETRY_ROUTING_HIGH);
    }

    @Bean
    public Binding submissionDlqBinding(Queue submissionDlq, TopicExchange submissionDeadLetterExchange) {
        return BindingBuilder.bind(submissionDlq).to(submissionDeadLetterExchange).with(SUBMISSION_DLQ_ROUTING);
    }

    @Bean
    public TopicExchange submissionResultExchange() {
        return new TopicExchange(SUBMISSION_RESULT_EXCHANGE);
    }

    @Bean
    public Queue submissionResultQueue() {
        return new Queue(SUBMISSION_RESULT_QUEUE, true);
    }

    @Bean
    public Binding submissionResultBinding(Queue submissionResultQueue, TopicExchange submissionResultExchange) {
        return BindingBuilder.bind(submissionResultQueue).to(submissionResultExchange).with(SUBMISSION_RESULT_ROUTING);
    }
}
