package com.gumasaje.copybara.snippet.dto;

import com.gumasaje.copybara.category.dto.CategorySummaryResponse;
import java.time.LocalDateTime;
import java.util.List;

public record SnippetSummaryResponse(
        Long snippetId,
        String title,
        String language,
        CategorySummaryResponse category,
        boolean favorite,
        List<String> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime deletedAt
) {}
