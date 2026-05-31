package com.gumasaje.copybara.analysis.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gumasaje.copybara.analysis.dto.SnippetAnalysisResult;
import com.gumasaje.copybara.common.exception.SnippetAnalysisGenerationException;
import com.gumasaje.copybara.member.domain.Member;
import com.gumasaje.copybara.snippet.domain.Snippet;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

class GeminiSnippetAnalysisGeneratorTest {

    private HttpServer server;

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void generateParsesStructuredResponseFromGenerateContentApi() throws Exception {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v1beta/models/gemini-test:generateContent", this::handleAnalysisRequest);
        server.start();

        String baseUrl = "http://localhost:" + server.getAddress().getPort();
        GeminiProperties properties = new GeminiProperties("test-key", "gemini-test", baseUrl, 5);
        GeminiSnippetAnalysisGenerator generator = new GeminiSnippetAnalysisGenerator(properties, new ObjectMapper());

        Snippet snippet = new Snippet(
                new Member("gemini-test@example.com", "encoded-password", "gemini-test"),
                null,
                "JWT filter",
                "public class JwtFilter { void validate() {} }",
                "Java"
        );

        SnippetAnalysisResult result = generator.generate(snippet);

        assertThat(result.summary()).isEqualTo("JWT 필터 검증 흐름을 다루는 Java 스니펫입니다.");
        assertThat(result.keyPoints()).containsExactly("토큰 검증 책임이 분리되어 있습니다.", "필터 계층에서 인증 흐름을 처리합니다.");
        assertThat(result.suggestedTags()).containsExactly("Java", "JWT", "Security");
        assertThat(generator.provider()).isEqualTo("gemini");
        assertThat(generator.model()).isEqualTo("gemini-test");
        assertThat(generator.promptVersion()).isEqualTo("snippet-analysis-gemini-v1");
    }

    @Test
    void generateWrapsProviderErrorsInReadableException() throws Exception {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v1beta/models/gemini-test:generateContent", exchange -> {
            byte[] responseBytes = "{\"error\":{\"message\":\"quota exceeded\"}}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(429, responseBytes.length);
            exchange.getResponseBody().write(responseBytes);
            exchange.close();
        });
        server.start();

        String baseUrl = "http://localhost:" + server.getAddress().getPort();
        GeminiProperties properties = new GeminiProperties("test-key", "gemini-test", baseUrl, 5);
        GeminiSnippetAnalysisGenerator generator = new GeminiSnippetAnalysisGenerator(properties, new ObjectMapper());

        Snippet snippet = new Snippet(
                new Member("gemini-error@example.com", "encoded-password", "gemini-error"),
                null,
                "Provider error",
                "public class Example {}",
                "Java"
        );

        assertThatThrownBy(() -> generator.generate(snippet))
                .isInstanceOf(SnippetAnalysisGenerationException.class)
                .hasMessage("스니펫 분석 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }

    private void handleAnalysisRequest(HttpExchange exchange) throws IOException {
        String requestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        String query = exchange.getRequestURI().getQuery();

        assertThat(exchange.getRequestMethod()).isEqualTo("POST");
        assertThat(query).isEqualTo("key=test-key");
        assertThat(requestBody).contains("\"responseMimeType\":\"application/json\"");
        assertThat(requestBody).contains("JWT filter");

        String responseBody = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": "{\\"summary\\":\\"JWT 필터 검증 흐름을 다루는 Java 스니펫입니다.\\",\\"keyPoints\\":[\\"토큰 검증 책임이 분리되어 있습니다.\\",\\"필터 계층에서 인증 흐름을 처리합니다.\\"],\\"suggestedTags\\":[\\"Java\\",\\"JWT\\",\\"Security\\"]}"
                          }
                        ]
                      }
                    }
                  ]
                }
                """;
        byte[] responseBytes = responseBody.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, responseBytes.length);
        exchange.getResponseBody().write(responseBytes);
        exchange.close();
    }
}
