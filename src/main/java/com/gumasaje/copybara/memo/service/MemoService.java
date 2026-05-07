package com.gumasaje.copybara.memo.service;

import com.gumasaje.copybara.memo.domain.Memo;
import com.gumasaje.copybara.memo.dto.MemoCreateRequest;
import com.gumasaje.copybara.memo.dto.MemoResponse;
import com.gumasaje.copybara.memo.repository.MemoRepository;
import com.gumasaje.copybara.common.exception.SnippetNotFoundException;
import com.gumasaje.copybara.snippet.domain.Snippet;
import com.gumasaje.copybara.snippet.repository.SnippetRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MemoService {

    private final MemoRepository memoRepository;
    private final SnippetRepository snippetRepository;

    public MemoService(
            MemoRepository memoRepository,
            SnippetRepository snippetRepository
    ) {
        this.memoRepository = memoRepository;
        this.snippetRepository = snippetRepository;
    }

    public MemoResponse create(Long memberId, Long snippetId, MemoCreateRequest request) {
        Snippet snippet = getOwnedSnippet(memberId, snippetId);

        Memo savedMemo = memoRepository.save(new Memo(snippet, request.content()));
        return toResponse(savedMemo);
    }

    @Transactional(readOnly = true)
    public List<MemoResponse> getMemos(Long memberId, Long snippetId) {
        getOwnedSnippet(memberId, snippetId);
        return memoRepository.findAllBySnippetIdOrderByCreatedAtAsc(snippetId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public MemoResponse update(Long memberId, Long snippetId, Long memoId, MemoCreateRequest request) {
        Memo memo = getOwnedMemo(memberId, snippetId, memoId);
        memo.update(request.content());
        return toResponse(memo);
    }

    public void delete(Long memberId, Long snippetId, Long memoId) {
        Memo memo = getOwnedMemo(memberId, snippetId, memoId);
        memoRepository.delete(memo);
    }

    private Snippet getOwnedSnippet(Long memberId, Long snippetId) {
        return snippetRepository.findByIdAndMemberId(snippetId, memberId)
                .orElseThrow(() -> new SnippetNotFoundException("해당 스니펫을 찾을 수 없습니다."));
    }

    private Memo getOwnedMemo(Long memberId, Long snippetId, Long memoId) {
        getOwnedSnippet(memberId, snippetId);
        return memoRepository.findByIdAndSnippetId(memoId, snippetId)
                .orElseThrow(() -> new SnippetNotFoundException("해당 메모를 찾을 수 없습니다."));
    }

    private MemoResponse toResponse(Memo memo) {
        return new MemoResponse(
                memo.getId(),
                memo.getSnippet().getId(),
                memo.getContent(),
                memo.getCreatedAt(),
                memo.getUpdatedAt()
        );
    }
}
