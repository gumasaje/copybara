package com.gumasaje.copybara.analysis.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gumasaje.copybara.analysis.dto.SnippetAnalysisResult;
import com.gumasaje.copybara.common.exception.SnippetAnalysisGenerationException;
import com.gumasaje.copybara.snippet.domain.Snippet;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Component
@Primary
@ConditionalOnExpression("'${gemini.api-key:}'.trim().length() > 0")
public class GeminiSnippetAnalysisGenerator implements SnippetAnalysisGenerator {

    private static final Logger log = LoggerFactory.getLogger(GeminiSnippetAnalysisGenerator.class);
    private static final String PROVIDER = "gemini";
    private static final String PROMPT_VERSION = "snippet-analysis-gemini-v1";

    private final GeminiProperties geminiProperties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public GeminiSnippetAnalysisGenerator(GeminiProperties geminiProperties, ObjectMapper objectMapper) {
        this.geminiProperties = geminiProperties;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        Duration timeout = Duration.ofSeconds(geminiProperties.timeoutSecondsOrDefault());
        requestFactory.setConnectTimeout(timeout);
        requestFactory.setReadTimeout(timeout);
        this.restClient = RestClient.builder()
                .baseUrl(geminiProperties.baseUrlOrDefault())
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public SnippetAnalysisResult generate(Snippet snippet) {
        try {
            String responseBody = restClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models/{model}:generateContent")
                            .queryParam("key", geminiProperties.apiKey())
                            .build(geminiProperties.modelOrDefault()))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(buildRequest(snippet))
                    .retrieve()
                    .body(String.class);

            return parseResult(responseBody);
        } catch (RestClientResponseException exception) {
            log.warn(
                    "Gemini snippet analysis request failed. status={}, body={}",
                    exception.getStatusCode(),
                    abbreviate(exception.getResponseBodyAsString(), 500)
            );
            throw new SnippetAnalysisGenerationException("스니펫 분석 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.", exception);
        } catch (RestClientException exception) {
            log.warn("Gemini snippet analysis request failed before receiving a response.", exception);
            throw new SnippetAnalysisGenerationException("스니펫 분석 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.", exception);
        }
    }

    @Override
    public String provider() {
        return PROVIDER;
    }

    @Override
    public String model() {
        return geminiProperties.modelOrDefault();
    }

    @Override
    public String promptVersion() {
        return PROMPT_VERSION;
    }

    private Map<String, Object> buildRequest(Snippet snippet) {
        return Map.of(
                "contents", List.of(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", buildPrompt(snippet)))
                )),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "responseSchema", responseSchema()
                )
        );
    }

    private String buildPrompt(Snippet snippet) {
        return """
                You analyze saved code snippets for a personal developer archive.
                Return concise Korean text. Suggested tags should be short technical labels.
                You may use Markdown in summary and keyPoints for emphasis, inline code, or short lists.
                Follow the JSON schema exactly.
                Prompt version: %s

                Title: %s
                Language: %s
                Existing tags: %s

                Code:
                %s
                """.formatted(
                PROMPT_VERSION,
                snippet.getTitle(),
                nullToUnknown(snippet.getLanguage()),
                snippet.getTags().stream().map(tag -> tag.getName()).toList(),
                snippet.getContent()
        );
    }

    private Map<String, Object> responseSchema() {
        return Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "summary", Map.of("type", "STRING"),
                        "keyPoints", Map.of(
                                "type", "ARRAY",
                                "items", Map.of("type", "STRING")
                        ),
                        "suggestedTags", Map.of(
                                "type", "ARRAY",
                                "items", Map.of("type", "STRING")
                        )
                ),
                "required", List.of("summary", "keyPoints", "suggestedTags"),
                "propertyOrdering", List.of("summary", "keyPoints", "suggestedTags")
        );
    }

    private SnippetAnalysisResult parseResult(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String outputText = extractOutputText(root);
            JsonNode result = objectMapper.readTree(outputText);

            String summary = requiredText(result, "summary");
            List<String> keyPoints = requiredStringList(result, "keyPoints");
            List<String> suggestedTags = requiredStringList(result, "suggestedTags");

            if (keyPoints.isEmpty() || suggestedTags.isEmpty()) {
                throw new SnippetAnalysisGenerationException("스니펫 분석 결과가 비어 있습니다.");
            }

            return new SnippetAnalysisResult(summary, keyPoints, suggestedTags);
        } catch (JsonProcessingException exception) {
            throw new SnippetAnalysisGenerationException("스니펫 분석 결과를 해석하지 못했습니다.", exception);
        }
    }

    private String extractOutputText(JsonNode root) {
        JsonNode candidates = root.get("candidates");
        if (candidates != null && candidates.isArray()) {
            for (JsonNode candidate : candidates) {
                JsonNode parts = candidate.path("content").path("parts");
                if (!parts.isArray()) {
                    continue;
                }
                for (JsonNode part : parts) {
                    JsonNode text = part.get("text");
                    if (text != null && text.isTextual() && !text.asText().isBlank()) {
                        return text.asText();
                    }
                }
            }
        }

        throw new SnippetAnalysisGenerationException("스니펫 분석 응답에 결과 텍스트가 없습니다.");
    }

    private String requiredText(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);
        if (value == null || !value.isTextual() || value.asText().isBlank()) {
            throw new SnippetAnalysisGenerationException("스니펫 분석 결과의 필수 값이 비어 있습니다.");
        }
        return value.asText().trim();
    }

    private List<String> requiredStringList(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);
        if (value == null || !value.isArray()) {
            throw new SnippetAnalysisGenerationException("스니펫 분석 결과의 목록 값이 올바르지 않습니다.");
        }

        List<String> values = objectMapper.convertValue(
                value,
                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
        );
        return values.stream()
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .distinct()
                .toList();
    }

    private String nullToUnknown(String value) {
        return value == null || value.isBlank() ? "Unknown" : value;
    }

    private String abbreviate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength) + "...";
    }
}
