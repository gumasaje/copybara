package com.gumasaje.algoreview.auth.dto;

public record SignupResponse(
        Long memberId,
        String email,
        String nickname
) {
}
