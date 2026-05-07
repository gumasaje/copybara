package com.gumasaje.copybara.attachment.dto;

import java.time.LocalDateTime;

public record AttachmentResponse(
        Long attachmentId,
        String originalName,
        String storedName,
        String contentType,
        long fileSize,
        LocalDateTime uploadedAt
) {
}
