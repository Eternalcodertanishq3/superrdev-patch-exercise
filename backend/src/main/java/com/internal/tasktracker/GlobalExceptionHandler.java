package com.internal.tasktracker;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Centralized exception handling advice for REST controllers.
 * Intercepts uncaught exceptions and returns standard RFC-compatible JSON error bodies.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Fix (Bug #13 & Bug #22 - Production-Readiness): Global exception handler to prevent stack trace disclosure.
    // Unhandled server exceptions previously yielded default whitelabel 500 error pages with internal framework stack traces.
    // This handler catches unexpected exceptions and maps them into a uniform, clean JSON response structure.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "Internal Server Error");
        body.put("message", ex.getMessage());

        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
