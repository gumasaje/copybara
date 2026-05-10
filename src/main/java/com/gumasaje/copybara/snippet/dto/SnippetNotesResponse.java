package com.gumasaje.copybara.snippet.dto;

import java.time.LocalDateTime;

public record SnippetNotesResponse(
        Long snippetId,
        String notes,
        LocalDateTime updatedAt
) {}
