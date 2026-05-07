package com.gumasaje.copybara.snippet.service;

import com.gumasaje.copybara.attachment.dto.AttachmentResponse;
import com.gumasaje.copybara.attachment.service.AttachmentService;
import com.gumasaje.copybara.common.exception.InvalidLoginException;
import com.gumasaje.copybara.common.exception.SnippetNotFoundException;
import com.gumasaje.copybara.member.domain.Member;
import com.gumasaje.copybara.member.repository.MemberRepository;
import com.gumasaje.copybara.snippet.domain.Snippet;
import com.gumasaje.copybara.snippet.dto.SnippetCreateRequest;
import com.gumasaje.copybara.snippet.dto.SnippetDetailResponse;
import com.gumasaje.copybara.snippet.dto.SnippetSummaryResponse;
import com.gumasaje.copybara.snippet.repository.SnippetRepository;
import com.gumasaje.copybara.tag.domain.Tag;
import com.gumasaje.copybara.tag.repository.TagRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SnippetService {

    private final SnippetRepository snippetRepository;
    private final MemberRepository memberRepository;
    private final TagRepository tagRepository;
    private final AttachmentService attachmentService;

    public SnippetService(
            SnippetRepository snippetRepository,
            MemberRepository memberRepository,
            TagRepository tagRepository,
            AttachmentService attachmentService
    ) {
        this.snippetRepository = snippetRepository;
        this.memberRepository = memberRepository;
        this.tagRepository = tagRepository;
        this.attachmentService = attachmentService;
    }

    public SnippetDetailResponse create(Long memberId, SnippetCreateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new InvalidLoginException("인증된 회원 정보를 찾을 수 없습니다."));
        Snippet snippet = new Snippet(member, request.title(), request.content(), request.language(), request.description());
        snippet.replaceTags(resolveTags(request.tags()));
        return toDetailResponse(snippetRepository.save(snippet));
    }

    @Transactional(readOnly = true)
    public List<SnippetSummaryResponse> getMySnippets(Long memberId, String keyword, String tag) {
        String normalizedKeyword = normalizeSearchKeyword(keyword);
        String normalizedTag = normalizeSearchTag(tag);

        if (normalizedKeyword == null && normalizedTag == null) {
            return snippetRepository.findAllByMemberIdOrderByUpdatedAtDesc(memberId)
                    .stream()
                    .map(this::toSummaryResponse)
                    .toList();
        }

        return snippetRepository.searchMySnippets(memberId, normalizedKeyword, normalizedTag)
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
        snippet.replaceTags(resolveTags(request.tags()));
        return toDetailResponse(snippet);
    }

    public void delete(Long memberId, Long snippetId) {
        snippetRepository.delete(findOwnedSnippet(memberId, snippetId));
    }

    private Snippet findOwnedSnippet(Long memberId, Long snippetId) {
        return snippetRepository.findByIdAndMemberId(snippetId, memberId)
                .orElseThrow(() -> new SnippetNotFoundException("해당 스니펫을 찾을 수 없습니다."));
    }

    private String normalizeSearchKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        return keyword.trim();
    }

    private String normalizeSearchTag(String tag) {
        if (tag == null || tag.isBlank()) {
            return null;
        }
        return Tag.normalize(tag);
    }

    private List<Tag> resolveTags(List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) return List.of();
        Map<String, String> normalizedTagNames = new LinkedHashMap<>();
        for (String tagName : tagNames) {
            String normalized = Tag.normalize(tagName);
            if (!normalized.isEmpty()) normalizedTagNames.putIfAbsent(normalized, tagName.trim());
        }
        if (normalizedTagNames.isEmpty()) return List.of();
        List<String> normalizedNames = new ArrayList<>(normalizedTagNames.keySet());
        List<Tag> existingTags = tagRepository.findAllByNormalizedNameIn(normalizedNames);
        Map<String, Tag> tagByName = new LinkedHashMap<>();
        for (Tag existingTag : existingTags) tagByName.put(existingTag.getNormalizedName(), existingTag);
        List<Tag> resolvedTags = new ArrayList<>();
        for (String normalizedName : normalizedNames) {
            Tag tag = tagByName.get(normalizedName);
            if (tag == null) tag = tagRepository.save(new Tag(normalizedTagNames.get(normalizedName)));
            resolvedTags.add(tag);
        }
        return resolvedTags;
    }

    private SnippetSummaryResponse toSummaryResponse(Snippet snippet) {
        return new SnippetSummaryResponse(snippet.getId(), snippet.getTitle(), snippet.getLanguage(), snippet.getDescription(), extractTagNames(snippet), snippet.getCreatedAt(), snippet.getUpdatedAt());
    }

    private SnippetDetailResponse toDetailResponse(Snippet snippet) {
        return new SnippetDetailResponse(snippet.getId(), snippet.getMember().getId(), snippet.getTitle(), snippet.getContent(), snippet.getLanguage(), snippet.getDescription(), extractTagNames(snippet), extractAttachments(snippet), snippet.getCreatedAt(), snippet.getUpdatedAt());
    }

    private List<String> extractTagNames(Snippet snippet) {
        return snippet.getTags().stream().map(Tag::getName).toList();
    }

    private List<AttachmentResponse> extractAttachments(Snippet snippet) {
        return snippet.getAttachments().stream().map(attachmentService::toResponse).toList();
    }
}
