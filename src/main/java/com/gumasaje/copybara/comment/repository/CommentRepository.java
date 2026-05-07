package com.gumasaje.copybara.comment.repository;

import com.gumasaje.copybara.comment.domain.Comment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findAllBySnippetIdOrderByCreatedAtAsc(Long snippetId);

    java.util.Optional<Comment> findByIdAndSnippetIdAndSnippetMemberId(Long commentId, Long snippetId, Long memberId);
}
