package com.gumasaje.copybara.analysis.service;

import com.gumasaje.copybara.analysis.domain.SnippetAnalysis;
import com.gumasaje.copybara.analysis.dto.SnippetAnalysisResponse;
import com.gumasaje.copybara.analysis.dto.SnippetAnalysisResult;
import com.gumasaje.copybara.analysis.repository.SnippetAnalysisRepository;
import com.gumasaje.copybara.common.exception.SnippetAnalysisNotFoundException;
import com.gumasaje.copybara.common.exception.SnippetNotFoundException;
import com.gumasaje.copybara.snippet.domain.Snippet;
import com.gumasaje.copybara.snippet.repository.SnippetRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SnippetAnalysisService {

    private final SnippetRepository snippetRepository;
    private final SnippetAnalysisRepository snippetAnalysisRepository;
    private final SnippetAnalysisGenerator snippetAnalysisGenerator;

    public SnippetAnalysisService(
            SnippetRepository snippetRepository,
            SnippetAnalysisRepository snippetAnalysisRepository,
            SnippetAnalysisGenerator snippetAnalysisGenerator
    ) {
        this.snippetRepository = snippetRepository;
        this.snippetAnalysisRepository = snippetAnalysisRepository;
        this.snippetAnalysisGenerator = snippetAnalysisGenerator;
    }

    public SnippetAnalysisResponse analyze(Long memberId, Long snippetId) {
        Snippet snippet = snippetRepository.findByIdAndMemberIdAndDeletedAtIsNull(snippetId, memberId)
                .orElseThrow(() -> new SnippetNotFoundException("해당 스니펫을 찾을 수 없습니다."));

        SnippetAnalysisResult result = snippetAnalysisGenerator.generate(snippet);
        String keyPoints = String.join("\n", result.keyPoints());
        String suggestedTags = String.join(",", result.suggestedTags());

        SnippetAnalysis analysis = snippetAnalysisRepository.findBySnippetId(snippetId)
                .map(existing -> {
                    existing.update(
                            result.summary(),
                            keyPoints,
                            suggestedTags,
                            snippetAnalysisGenerator.provider(),
                            snippetAnalysisGenerator.model(),
                            snippetAnalysisGenerator.promptVersion()
                    );
                    return existing;
                })
                .orElseGet(() -> snippetAnalysisRepository.save(
                        new SnippetAnalysis(
                                snippet,
                                result.summary(),
                                keyPoints,
                                suggestedTags,
                                snippetAnalysisGenerator.provider(),
                                snippetAnalysisGenerator.model(),
                                snippetAnalysisGenerator.promptVersion()
                        )
                ));

        return toResponse(analysis);
    }

    @Transactional(readOnly = true)
    public SnippetAnalysisResponse getAnalysis(Long memberId, Long snippetId) {
        snippetRepository.findByIdAndMemberIdAndDeletedAtIsNull(snippetId, memberId)
                .orElseThrow(() -> new SnippetNotFoundException("해당 스니펫을 찾을 수 없습니다."));

        SnippetAnalysis analysis = snippetAnalysisRepository.findBySnippetId(snippetId)
                .orElseThrow(() -> new SnippetAnalysisNotFoundException("해당 스니펫의 분석 결과를 찾을 수 없습니다."));

        return toResponse(analysis);
    }

    private SnippetAnalysisResponse toResponse(SnippetAnalysis analysis) {
        return new SnippetAnalysisResponse(
                analysis.getId(),
                analysis.getSnippet().getId(),
                analysis.getSummary(),
                splitLines(analysis.getKeyPoints()),
                splitCommaSeparated(analysis.getSuggestedTags()),
                analysis.getProvider(),
                analysis.getModel(),
                analysis.getPromptVersion(),
                analysis.getAnalyzedAt(),
                analysis.getCreatedAt()
        );
    }

    private List<String> splitLines(String value) {
        return value.lines().filter(line -> !line.isBlank()).toList();
    }

    private List<String> splitCommaSeparated(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return List.of(value.split(","));
    }
}
