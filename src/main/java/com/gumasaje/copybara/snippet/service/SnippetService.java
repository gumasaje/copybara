package com.gumasaje.copybara.snippet.service;

import com.gumasaje.copybara.common.exception.InvalidLoginException;
import com.gumasaje.copybara.common.exception.SnippetNotFoundException;
import com.gumasaje.copybara.member.domain.Member;
import com.gumasaje.copybara.member.repository.MemberRepository;
import com.gumasaje.copybara.snippet.domain.Snippet;
import com.gumasaje.copybara.snippet.dto.SnippetCreateRequest;
import com.gumasaje.copybara.snippet.dto.SnippetDetailResponse;
import com.gumasaje.copybara.snippet.dto.SnippetSummaryResponse;
import com.gumasaje.copybara.snippet.repository.SnippetRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SnippetService {

    private final SnippetRepository snippetRepository;
    private final MemberRepository memberRepository;

    public SnippetService(SnippetRepository snippetRepository, MemberRepository memberRepository) {
        this.snippetRepository = snippetRepository;
        this.memberRepository = memberRepository;
    }

    public SnippetDetailResponse create(Long memberId, SnippetCreateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new InvalidLoginException("인증된 회원 정보를 찾을 수 없습니다."));

        Snippet savedSnippet = snippetRepository.save(new Snippet(
                member,
                request.title(),
                request.content(),
                request.language(),
                request.description()
        ));
        return toDetailResponse(savedSnippet);
    }

    @Transactional(readOnly = true)
    public List<SnippetSummaryResponse> getMySnippets(Long memberId) {
        return snippetRepository.findAllByMemberIdOrderByUpdatedAtDesc(memberId)
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SnippetDetailResponse getMySnippet(Long memberId, Long snippetId) {
        return toDetailResponse(findOwnedSnippet(memberId, snippetId));
    }

    public SnippetDetailResponse update(Long memberId, Long snippetId, SnippetCreateRequest request) {
        Snippet snippet = findOwnedSnippet(memberId, snippetId);
        snippet.update(request.title(), request.content(), request.language(), request.description());
        return toDetailResponse(snippet);
    }

    public void delete(Long memberId, Long snippetId) {
        snippetRepository.delete(findOwnedSnippet(memberId, snippetId));
    }

    private Snippet findOwnedSnippet(Long memberId, Long snippetId) {
        return snippetRepository.findByIdAndMemberId(snippetId, memberId)
                .orElseThrow(() -> new SnippetNotFoundException("해당 스니펫을 찾을 수 없습니다."));
    }

    private SnippetSummaryResponse toSummaryResponse(Snippet snippet) {
        return new SnippetSummaryResponse(
                snippet.getId(),
                snippet.getTitle(),
                snippet.getLanguage(),
                snippet.getDescription(),
                snippet.getCreatedAt(),
                snippet.getUpdatedAt()
        );
    }

    private SnippetDetailResponse toDetailResponse(Snippet snippet) {
        return new SnippetDetailResponse(
                snippet.getId(),
                snippet.getMember().getId(),
                snippet.getTitle(),
                snippet.getContent(),
                snippet.getLanguage(),
                snippet.getDescription(),
                snippet.getCreatedAt(),
                snippet.getUpdatedAt()
        );
    }
}
