package com.gumasaje.copybara.analysis.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

class SnippetAnalysisGeneratorSelectionTest {

    @SpringBootTest(properties = {
            "gemini.api-key="
    })
    static class NoProviderKey {

        @Autowired
        private SnippetAnalysisGenerator snippetAnalysisGenerator;

        @Test
        void usesHeuristicFallbackWhenProviderKeysAreMissing() {
            assertThat(snippetAnalysisGenerator.provider()).isEqualTo("heuristic-dev-fallback");
        }
    }

    @SpringBootTest(properties = {
            "gemini.api-key=test-gemini-key"
    })
    static class GeminiOnly {

        @Autowired
        private SnippetAnalysisGenerator snippetAnalysisGenerator;

        @Test
        void usesGeminiWhenGeminiKeyExists() {
            assertThat(snippetAnalysisGenerator.provider()).isEqualTo("gemini");
        }
    }
}
