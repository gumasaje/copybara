package com.gumasaje.copybara.snippet.dto;

import java.time.LocalDateTime;

public record SnippetDetailResponse(
        Long snippetId,
        Long memberId,
        String title,
        String content,
        String language,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
