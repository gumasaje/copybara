package com.gumasaje.copybara.common.exception;

import org.springframework.http.HttpStatus;
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

    @ExceptionHandler(SnippetAnalysisNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleSnippetAnalysisNotFoundException(SnippetAnalysisNotFoundException exception) {
        return new ErrorResponse("SNIPPET_ANALYSIS_NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler(InvalidAttachmentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleInvalidAttachmentException(InvalidAttachmentException exception) {
        return new ErrorResponse("INVALID_ATTACHMENT", exception.getMessage());
    }

    @ExceptionHandler(AttachmentStorageException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleAttachmentStorageException(AttachmentStorageException exception) {
        return new ErrorResponse("ATTACHMENT_STORAGE_ERROR", exception.getMessage());
    }
}
