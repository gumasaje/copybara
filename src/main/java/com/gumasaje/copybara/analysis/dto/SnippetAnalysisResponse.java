package com.gumasaje.copybara.analysis.dto;

import java.time.LocalDateTime;
import java.util.List;

public record SnippetAnalysisResponse(
        Long analysisId,
        Long snippetId,
        String summary,
        List<String> keyPoints,
        List<String> suggestedTags,
        String provider,
        String model,
        String promptVersion,
        LocalDateTime analyzedAt,
        LocalDateTime createdAt
) {
}
