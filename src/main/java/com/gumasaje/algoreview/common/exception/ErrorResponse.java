package com.gumasaje.algoreview.common.exception;

public record ErrorResponse(
        String code,
        String message
) {
}
