package com.gumasaje.copybara.snippet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record SnippetCreateRequest(
        @NotBlank(message = "제목은 필수입니다.")
        @Size(max = 100, message = "제목은 100자 이하여야 합니다.")
        String title,

        @NotBlank(message = "본문은 필수입니다.")
        String content,

        @Size(max = 50, message = "언어는 50자 이하여야 합니다.")
        String language,

        @Size(max = 255, message = "설명은 255자 이하여야 합니다.")
        String description,

        Long categoryId,

        List<@NotBlank(message = "태그 이름은 비어 있을 수 없습니다.") @Size(max = 50, message = "태그 이름은 50자 이하여야 합니다.") String> tags
) {}
