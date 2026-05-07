package com.gumasaje.copybara.comment.service;

import com.gumasaje.copybara.comment.domain.Comment;
import com.gumasaje.copybara.comment.dto.CommentCreateRequest;
import com.gumasaje.copybara.comment.dto.CommentResponse;
import com.gumasaje.copybara.comment.repository.CommentRepository;
import com.gumasaje.copybara.common.exception.InvalidLoginException;
import com.gumasaje.copybara.common.exception.SnippetNotFoundException;
import com.gumasaje.copybara.member.domain.Member;
import com.gumasaje.copybara.member.repository.MemberRepository;
import com.gumasaje.copybara.snippet.domain.Snippet;
import com.gumasaje.copybara.snippet.repository.SnippetRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final SnippetRepository snippetRepository;
    private final MemberRepository memberRepository;

    public CommentService(
            CommentRepository commentRepository,
            SnippetRepository snippetRepository,
            MemberRepository memberRepository
    ) {
        this.commentRepository = commentRepository;
        this.snippetRepository = snippetRepository;
        this.memberRepository = memberRepository;
    }

    public CommentResponse create(Long memberId, Long snippetId, CommentCreateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new InvalidLoginException("인증된 회원 정보를 찾을 수 없습니다."));
        Snippet snippet = getOwnedSnippet(memberId, snippetId);

        Comment savedComment = commentRepository.save(new Comment(snippet, member, request.content()));
        return toResponse(savedComment);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long memberId, Long snippetId) {
        getOwnedSnippet(memberId, snippetId);
        return commentRepository.findAllBySnippetIdOrderByCreatedAtAsc(snippetId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CommentResponse update(Long memberId, Long snippetId, Long commentId, CommentCreateRequest request) {
        Comment comment = getOwnedComment(memberId, snippetId, commentId);
        comment.update(request.content());
        return toResponse(comment);
    }

    public void delete(Long memberId, Long snippetId, Long commentId) {
        Comment comment = getOwnedComment(memberId, snippetId, commentId);
        commentRepository.delete(comment);
    }

    private Snippet getOwnedSnippet(Long memberId, Long snippetId) {
        return snippetRepository.findByIdAndMemberId(snippetId, memberId)
                .orElseThrow(() -> new SnippetNotFoundException("해당 스니펫을 찾을 수 없습니다."));
    }

    private Comment getOwnedComment(Long memberId, Long snippetId, Long commentId) {
        return commentRepository.findByIdAndSnippetIdAndSnippetMemberId(commentId, snippetId, memberId)
                .orElseThrow(() -> new SnippetNotFoundException("해당 댓글을 찾을 수 없습니다."));
    }

    private CommentResponse toResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getSnippet().getId(),
                comment.getMember().getId(),
                comment.getMember().getNickname(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
