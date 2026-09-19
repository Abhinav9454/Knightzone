package com.collegecontest.judge.controller;

import com.collegecontest.judge.dto.SubmissionRequest;
import com.collegecontest.judge.dto.SubmissionResult;
import com.collegecontest.judge.service.DockerExecutionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExecutionControllerTest {

    @Mock
    private ObjectProvider<DockerExecutionService> provider;

    @Mock
    private DockerExecutionService dockerExecutionService;

    @Test
    void executeReturns503WhenDockerServiceUnavailable() {
        when(provider.getIfAvailable()).thenReturn(null);
        ExecutionController controller = new ExecutionController(provider);

        ResponseEntity<Map<String, Object>> response = controller.execute(Map.of());

        assertEquals(503, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("error", response.getBody().get("status"));
        assertEquals("Judge execution service unavailable", response.getBody().get("error"));
    }

    @Test
    void executeReturnsLegacySuccessPayload() throws Exception {
        when(provider.getIfAvailable()).thenReturn(dockerExecutionService);
        SubmissionResult result = new SubmissionResult();
        result.setStatus("ACCEPTED");
        result.setStdout("hello");
        result.setStderr(null);
        result.setRuntimeSeconds(0.123);
        when(dockerExecutionService.execute(any(SubmissionRequest.class))).thenReturn(result);
        ExecutionController controller = new ExecutionController(provider);

        ResponseEntity<Map<String, Object>> response = controller.execute(Map.of(
                "language", "python",
                "code", "print('hello')",
                "input", "",
                "timeLimitSeconds", 7,
                "memoryMb", 300,
                "cpus", 1.0
        ));

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("success", response.getBody().get("status"));
        assertEquals("hello", response.getBody().get("output"));
        assertEquals(123, response.getBody().get("executionTime"));
        assertNull(response.getBody().get("error"));
    }

    @Test
    void executeUsesFallbackRequestValuesForInvalidPayload() throws Exception {
        when(provider.getIfAvailable()).thenReturn(dockerExecutionService);
        SubmissionResult result = new SubmissionResult();
        result.setStatus("TIME_LIMIT");
        result.setStdout("");
        result.setStderr("");
        result.setRuntimeSeconds(1.0);
        when(dockerExecutionService.execute(any(SubmissionRequest.class))).thenReturn(result);
        ExecutionController controller = new ExecutionController(provider);

        Map<String, Object> payload = new HashMap<>();
        payload.put("language", "   ");
        payload.put("code", null);
        payload.put("input", null);
        payload.put("timeLimitSeconds", "invalid");
        payload.put("memoryMb", "x");
        payload.put("cpus", "bad");

        ResponseEntity<Map<String, Object>> response = controller.execute(payload);

        ArgumentCaptor<SubmissionRequest> captor = ArgumentCaptor.forClass(SubmissionRequest.class);
        verify(dockerExecutionService).execute(captor.capture());
        SubmissionRequest request = captor.getValue();
        assertEquals("java", request.getLanguage());
        assertEquals("", request.getCode());
        assertEquals("", request.getStdin());
        assertEquals(5, request.getTimeLimitSeconds());
        assertEquals(256, request.getMemoryMb());
        assertEquals(0.5, request.getCpus());

        assertEquals(200, response.getStatusCode().value());
        assertEquals("timeout", response.getBody().get("status"));
        assertEquals("TIME_LIMIT", response.getBody().get("error"));
    }

    @Test
    void executeReturns500WhenExecutionThrowsException() throws Exception {
        when(provider.getIfAvailable()).thenReturn(dockerExecutionService);
        when(dockerExecutionService.execute(any(SubmissionRequest.class)))
                .thenThrow(new RuntimeException("docker failed"));
        ExecutionController controller = new ExecutionController(provider);

        ResponseEntity<Map<String, Object>> response = controller.execute(Map.of(
                "language", "java",
                "code", "class Main{}"
        ));

        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("error", response.getBody().get("status"));
        assertEquals("Execution failed: docker failed", response.getBody().get("error"));
    }
}
