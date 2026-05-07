package com.gumasaje.copybara.auth.dto;

public record MeResponse(
        Long memberId,
        String email,
        String nickname
) {
}
