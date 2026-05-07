package com.gumasaje.copybara.memo.dto;

import java.time.LocalDateTime;

public record MemoResponse(
        Long memoId,
        Long snippetId,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
