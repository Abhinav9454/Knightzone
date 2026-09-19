package com.collegecontest.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleBadRequestReturnsStandardErrorEnvelope() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/example");
        request.addHeader("X-Correlation-Id", "corr-123");

        ResponseEntity<ErrorResponse> response = handler.handleBadRequest(
                new BadRequestException("Invalid payload"),
                request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("corr-123", response.getHeaders().getFirst("X-Correlation-Id"));

        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(400, body.getStatus());
        assertEquals("Bad Request", body.getError());
        assertEquals("BAD_REQUEST", body.getCode());
        assertEquals("Invalid payload", body.getMessage());
        assertEquals("/api/example", body.getPath());
        assertEquals("corr-123", body.getCorrelationId());
    }

    @Test
    void handleResponseStatusUsesReasonAndGeneratesCorrelationIdWhenMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/secure");

        ResponseEntity<ErrorResponse> response = handler.handleResponseStatus(
                new ResponseStatusException(HttpStatus.FORBIDDEN, "No access"),
                request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals("RESPONSE_STATUS_EXCEPTION", body.getCode());
        assertEquals("No access", body.getMessage());
        assertEquals("/api/secure", body.getPath());
        assertNotNull(body.getCorrelationId());
        assertTrue(!body.getCorrelationId().isBlank());
        assertNotSame("No access", body.getCorrelationId());
    }
}
