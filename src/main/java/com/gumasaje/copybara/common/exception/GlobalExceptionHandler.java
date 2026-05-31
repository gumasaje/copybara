package com.gumasaje.copybara.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateEmailException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleDuplicateEmailException(DuplicateEmailException exception) {
        return new ErrorResponse("DUPLICATE_EMAIL", exception.getMessage());
    }

    @ExceptionHandler(DuplicateNicknameException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleDuplicateNicknameException(DuplicateNicknameException exception) {
        return new ErrorResponse("DUPLICATE_NICKNAME", exception.getMessage());
    }

    @ExceptionHandler(DuplicateCategoryNameException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleDuplicateCategoryNameException(DuplicateCategoryNameException exception) {
        return new ErrorResponse("DUPLICATE_CATEGORY_NAME", exception.getMessage());
    }

    @ExceptionHandler(InvalidLoginException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErrorResponse handleInvalidLoginException(InvalidLoginException exception) {
        return new ErrorResponse("INVALID_LOGIN", exception.getMessage());
    }

    @ExceptionHandler(SnippetNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleSnippetNotFoundException(SnippetNotFoundException exception) {
        return new ErrorResponse("SNIPPET_NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler(CategoryNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleCategoryNotFoundException(CategoryNotFoundException exception) {
        return new ErrorResponse("CATEGORY_NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler(SnippetAnalysisNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleSnippetAnalysisNotFoundException(SnippetAnalysisNotFoundException exception) {
        return new ErrorResponse("SNIPPET_ANALYSIS_NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler(SnippetAnalysisGenerationException.class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    public ErrorResponse handleSnippetAnalysisGenerationException(SnippetAnalysisGenerationException exception) {
        return new ErrorResponse("SNIPPET_ANALYSIS_GENERATION_FAILED", exception.getMessage());
    }

    @ExceptionHandler(InvalidCategoryOrderException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleInvalidCategoryOrderException(InvalidCategoryOrderException exception) {
        return new ErrorResponse("INVALID_CATEGORY_ORDER", exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleMethodArgumentNotValidException(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("요청 값이 올바르지 않습니다.");
        return new ErrorResponse("VALIDATION_ERROR", message);
    }
}
