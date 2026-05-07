package com.gumasaje.copybara.snippet.dto;

import java.time.LocalDateTime;
import java.util.List;

public record SnippetSummaryResponse(
        Long snippetId,
        String title,
        String language,
        String description,
        boolean favorite,
        List<String> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
