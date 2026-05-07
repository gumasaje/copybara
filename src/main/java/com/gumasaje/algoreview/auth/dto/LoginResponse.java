package com.gumasaje.algoreview.auth.dto;

public record LoginResponse(
        Long memberId,
        String email,
        String nickname
) {
}
