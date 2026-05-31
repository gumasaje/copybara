package com.gumasaje.copybara.analysis.service;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gemini")
public record GeminiProperties(
        String apiKey,
        String model,
        String baseUrl,
        int timeoutSeconds
) {
    public String modelOrDefault() {
        return hasText(model) ? model : "gemini-2.5-flash";
    }

    public String baseUrlOrDefault() {
        return hasText(baseUrl) ? baseUrl : "https://generativelanguage.googleapis.com";
    }

    public int timeoutSecondsOrDefault() {
        return timeoutSeconds > 0 ? timeoutSeconds : 30;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
