package com.example.budget.web;

import com.example.budget.service.ExchangeRateService.RateNotAvailableException;
import com.example.budget.service.NoBuildPossibleException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(NoSuchElementException.class)
    public ProblemDetail notFound(NoSuchElementException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail validation(MethodArgumentNotValidException e) {
        String details = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, details);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail badParam(MethodArgumentTypeMismatchException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "Некоректне значення параметра '" + e.getName() + "'");
    }

    /** Порушення @Positive та інших constraint-ів на параметрах методу контролера (Spring 6.1+). */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ProblemDetail paramValidation(HandlerMethodValidationException e) {
        String name = e.getAllValidationResults().stream()
                .map(r -> r.getMethodParameter().getParameterName())
                .filter(n -> n != null)
                .findFirst()
                .orElse("?");
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "Некоректне значення параметра '" + name + "'");
    }

    @ExceptionHandler(NoBuildPossibleException.class)
    public ProblemDetail noBuild(NoBuildPossibleException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, e.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail unreadableBody(HttpMessageNotReadableException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "Некоректне тіло запиту. Валюта: UAH, USD або EUR; бренди: NVIDIA, AMD, INTEL, MSI, GIGABYTE");
    }

    @ExceptionHandler(RateNotAvailableException.class)
    public ProblemDetail rateMissing(RateNotAvailableException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, e.getMessage());
    }
}
