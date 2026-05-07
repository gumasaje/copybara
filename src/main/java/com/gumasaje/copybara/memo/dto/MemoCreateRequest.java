package com.gumasaje.copybara.memo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MemoCreateRequest(
        @NotBlank(message = "메모 내용은 필수입니다.")
        @Size(max = 1000, message = "메모는 1000자 이하여야 합니다.")
        String content
) {
}
