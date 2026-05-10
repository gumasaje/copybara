package com.gumasaje.copybara.snippet.dto;

import jakarta.validation.constraints.Size;

public record SnippetNotesRequest(
        @Size(max = 10000, message = "노트는 10000자 이하여야 합니다.")
        String content
) {}
