package com.gumasaje.copybara.auth.dto;

public record SignupResponse(
        Long memberId,
        String email,
        String nickname
) {
}
