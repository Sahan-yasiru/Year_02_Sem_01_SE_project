package org.com.application_backend.exception;

import org.com.application_backend.util.APIResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<APIResponse<Void>> handleBusinessException(CustomException e) {
        return ResponseEntity.badRequest()
                .body(new APIResponse<>(HttpStatus.BAD_REQUEST.value(), e.getMessage(), null));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<APIResponse<Map<String, String>>> handleValidation(MethodArgumentNotValidException e) {

        Map<String, String> errors = new HashMap<>();

        e.getBindingResult().getFieldErrors().forEach(error -> {
            errors.put(error.getField(), error.getDefaultMessage());
        });

        return ResponseEntity.badRequest()
                .body(new APIResponse<>(HttpStatus.BAD_REQUEST.value(), "Validation failed", errors));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<APIResponse<Void>> handleMalformedRequest(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest()
                .body(new APIResponse<>(HttpStatus.BAD_REQUEST.value(), "Malformed request body", null));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<APIResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new APIResponse<>(HttpStatus.CONFLICT.value(), "Request conflicts with existing data", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<APIResponse<Void>> handleGenericException(Exception e) {
        e.printStackTrace();
        String msg = (e.getMessage() != null && !e.getMessage().isBlank()) ? e.getMessage() : "Internal server error";
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new APIResponse<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), msg, null));
    }
}
