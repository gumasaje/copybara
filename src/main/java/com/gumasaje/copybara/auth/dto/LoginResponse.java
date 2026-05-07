package com.gumasaje.copybara.auth.dto;

public record LoginResponse(
        Long memberId,
        String email,
        String nickname
) {
}
