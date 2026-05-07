package com.gumasaje.copybara.common.exception;

public record ErrorResponse(
        String code,
        String message
) {
}
