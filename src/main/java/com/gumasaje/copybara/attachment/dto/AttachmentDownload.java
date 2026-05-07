package com.gumasaje.copybara.attachment.dto;

import org.springframework.core.io.Resource;

public record AttachmentDownload(
        String originalName,
        String contentType,
        long fileSize,
        Resource resource
) {
}
