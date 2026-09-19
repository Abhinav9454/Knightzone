package com.collegecontest.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JudgeResultRabbitConfig {
    public static final String SUBMISSION_RESULT_EXCHANGE = "submission.result.exchange";
    public static final String SUBMISSION_RESULT_QUEUE = "submission.result.queue";
    public static final String SUBMISSION_RESULT_ROUTING = "submission.result.routing";

    @Bean
    public TopicExchange submissionResultExchange() {
        return new TopicExchange(SUBMISSION_RESULT_EXCHANGE, true, false);
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
