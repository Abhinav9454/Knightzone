package com.collegecontest.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex,
            HttpServletRequest request) {
        logger.warn("Resource not found: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", ex.getMessage(), request, null);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex, HttpServletRequest request) {
        logger.warn("Bad request: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), request, null);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex, HttpServletRequest request) {
        logger.warn("Unauthorized access: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", ex.getMessage(), request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        logger.info("Validation failed: {}", ex.getMessage());
        Map<String, String> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        fe -> fe.getField(),
                        fe -> fe.getDefaultMessage(),
                        (existing, replacement) -> existing,
                        LinkedHashMap::new));

        return buildResponse(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Validation failed", request, fieldErrors);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex, HttpServletRequest request) {
        logger.warn("ResponseStatusException: {}", ex.getMessage(), ex);
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        String message = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        return buildResponse(status, "RESPONSE_STATUS_EXCEPTION", message, request, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        logger.warn("Forbidden access: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Forbidden", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex, HttpServletRequest request) {
        logger.error("Unhandled exception", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "Internal server error",
                request, null);
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String code, String message,
            HttpServletRequest request, Map<String, String> fieldErrors) {
        String correlationId = resolveCorrelationId(request);
        ErrorResponse body = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .code(code)
                .message(message)
                .path(request != null ? request.getRequestURI() : null)
                .correlationId(correlationId)
                .errors(fieldErrors)
                .build();

        return ResponseEntity.status(status)
                .header("X-Correlation-Id", correlationId)
                .body(body);
    }

    private String resolveCorrelationId(HttpServletRequest request) {
        if (request != null) {
            String requestHeader = request.getHeader("X-Correlation-Id");
            if (requestHeader != null && !requestHeader.isBlank()) {
                return requestHeader;
            }

            String requestIdHeader = request.getHeader("X-Request-Id");
            if (requestIdHeader != null && !requestIdHeader.isBlank()) {
                return requestIdHeader;
            }
        }

        String fromMdc = MDC.get("correlationId");
        if (fromMdc != null && !fromMdc.isBlank()) {
            return fromMdc;
        }

        String requestIdFromMdc = MDC.get("requestId");
        if (requestIdFromMdc != null && !requestIdFromMdc.isBlank()) {
            return requestIdFromMdc;
        }

        return UUID.randomUUID().toString();
    }
}
