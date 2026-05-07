package com.gumasaje.copybara.analysis.service;

import com.gumasaje.copybara.analysis.dto.SnippetAnalysisResult;
import com.gumasaje.copybara.snippet.domain.Snippet;

public interface SnippetAnalysisGenerator {

    SnippetAnalysisResult generate(Snippet snippet);
}
