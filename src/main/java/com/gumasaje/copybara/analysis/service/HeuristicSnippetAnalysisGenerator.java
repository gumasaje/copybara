package com.gumasaje.copybara.analysis.service;

import com.gumasaje.copybara.analysis.dto.SnippetAnalysisResult;
import com.gumasaje.copybara.snippet.domain.Snippet;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class HeuristicSnippetAnalysisGenerator implements SnippetAnalysisGenerator {

    @Override
    public SnippetAnalysisResult generate(Snippet snippet) {
        String summary = buildSummary(snippet);
        List<String> keyPoints = buildKeyPoints(snippet);
        List<String> suggestedTags = buildSuggestedTags(snippet);
        return new SnippetAnalysisResult(summary, keyPoints, suggestedTags);
    }

    private String buildSummary(Snippet snippet) {
        String content = snippet.getContent();
        String preview = content.length() > 80 ? content.substring(0, 80) + "..." : content;
        return "`%s` 스니펫은 %s 코드 조각을 저장하고 있으며, 현재 내용 미리보기는 `%s` 입니다."
                .formatted(snippet.getTitle(), nullToUnknown(snippet.getLanguage()), preview);
    }

    private List<String> buildKeyPoints(Snippet snippet) {
        List<String> keyPoints = new ArrayList<>();
        keyPoints.add("언어: %s".formatted(nullToUnknown(snippet.getLanguage())));
        keyPoints.add("태그 수: %d".formatted(snippet.getTags().size()));
        return keyPoints;
    }

    private List<String> buildSuggestedTags(Snippet snippet) {
        List<String> suggestedTags = new ArrayList<>();
        if (snippet.getLanguage() != null && !snippet.getLanguage().isBlank()) {
            suggestedTags.add(snippet.getLanguage());
        }
        if (snippet.getContent().contains("JWT") || snippet.getContent().contains("jwt")) {
            suggestedTags.add("Security");
        }
        if (snippet.getContent().contains("SELECT") || snippet.getContent().contains("select")) {
            suggestedTags.add("SQL");
        }
        if (suggestedTags.isEmpty()) {
            suggestedTags.add("Snippet");
        }
        return suggestedTags.stream().distinct().toList();
    }

    private String nullToUnknown(String value) {
        return value == null || value.isBlank() ? "Unknown" : value;
    }
}
