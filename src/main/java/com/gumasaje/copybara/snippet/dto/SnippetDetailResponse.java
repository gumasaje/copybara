package com.gumasaje.copybara.snippet.dto;

import com.gumasaje.copybara.category.dto.CategorySummaryResponse;
import java.time.LocalDateTime;
import java.util.List;

public record SnippetDetailResponse(
        Long snippetId,
        String title,
        String content,
        String language,
        String notes,
        CategorySummaryResponse category,
        boolean favorite,
        List<String> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime deletedAt
) {}
