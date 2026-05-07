package com.gumasaje.copybara.comment.dto;

import java.time.LocalDateTime;

public record CommentResponse(
        Long commentId,
        Long snippetId,
        Long memberId,
        String nickname,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
