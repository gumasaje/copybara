package com.gumasaje.copybara.snippet.dto;

import com.gumasaje.copybara.attachment.dto.AttachmentResponse;
import java.time.LocalDateTime;
import java.util.List;

public record SnippetDetailResponse(
        Long snippetId,
        String title,
        String content,
        String language,
        String description,
        boolean favorite,
        List<String> tags,
        List<AttachmentResponse> attachments,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
