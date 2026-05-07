package com.gumasaje.copybara.snippet.dto;

import java.time.LocalDateTime;

public record SnippetSummaryResponse(
        Long snippetId,
        String title,
        String language,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
