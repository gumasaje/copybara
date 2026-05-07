package com.gumasaje.copybara.analysis.dto;

import java.util.List;

public record SnippetAnalysisResult(
        String summary,
        List<String> keyPoints,
        List<String> suggestedTags
) {
}
