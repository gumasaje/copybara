package com.gumasaje.copybara.snippet.dto;

import jakarta.validation.constraints.NotNull;

public record SnippetFavoriteRequest(
        @NotNull(message = "즐겨찾기 여부는 필수입니다.")
        Boolean favorite
) {
}
