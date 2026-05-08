package com.gumasaje.copybara.category.dto;

import java.time.LocalDateTime;

public record CategoryResponse(
        Long categoryId,
        String name,
        long snippetCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
