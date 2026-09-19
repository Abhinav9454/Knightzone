package com.collegecontest.judge.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JudgeStatusResolverTest {

    private final JudgeStatusResolver resolver = new JudgeStatusResolver();

    @Test
    void normalizeExecutionStatusMapsKnownStatuses() {
        assertEquals("ACCEPTED", resolver.normalizeExecutionStatus("accepted"));
        assertEquals("ACCEPTED", resolver.normalizeExecutionStatus("success"));
        assertEquals("TIME_LIMIT", resolver.normalizeExecutionStatus("timeout"));
        assertEquals("COMPILE_ERROR", resolver.normalizeExecutionStatus("compile_error"));
        assertEquals("RUNTIME_ERROR", resolver.normalizeExecutionStatus("error"));
        assertEquals("FAILED", resolver.normalizeExecutionStatus("wrong_answer"));
    }

    @Test
    void normalizeExecutionStatusHandlesUnknownAndNull() {
        assertEquals("ERROR", resolver.normalizeExecutionStatus(null));
        assertEquals("SOME_NEW_STATUS", resolver.normalizeExecutionStatus(" some_new_status "));
    }

    @Test
    void prioritizeStatusKeepsHigherSeverityStatus() {
        assertEquals("FAILED", resolver.prioritizeStatus("ACCEPTED", "FAILED"));
        assertEquals("RUNTIME_ERROR", resolver.prioritizeStatus("FAILED", "RUNTIME_ERROR"));
        assertEquals("TIME_LIMIT", resolver.prioritizeStatus("RUNTIME_ERROR", "TIMEOUT"));
        assertEquals("COMPILE_ERROR", resolver.prioritizeStatus("TIME_LIMIT", "COMPILE_ERROR"));
    }

    @Test
    void prioritizeStatusDoesNotDowngradeSeverity() {
        assertEquals("COMPILE_ERROR", resolver.prioritizeStatus("COMPILE_ERROR", "ACCEPTED"));
        assertEquals("TIME_LIMIT", resolver.prioritizeStatus("TIME_LIMIT", "FAILED"));
    }
}
