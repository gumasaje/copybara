package com.gumasaje.copybara.category.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CategoryReorderRequest(
        @NotNull(message = "카테고리 순서 정보는 필수입니다.")
        List<Long> orderedCategoryIds
) {}
