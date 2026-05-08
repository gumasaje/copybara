package com.gumasaje.copybara.category.service;

import com.gumasaje.copybara.category.domain.Category;
import com.gumasaje.copybara.category.dto.CategoryCreateRequest;
import com.gumasaje.copybara.category.dto.CategoryResponse;
import com.gumasaje.copybara.category.dto.CategorySummaryResponse;
import com.gumasaje.copybara.category.repository.CategoryRepository;
import com.gumasaje.copybara.common.exception.CategoryNotFoundException;
import com.gumasaje.copybara.common.exception.DuplicateCategoryNameException;
import com.gumasaje.copybara.common.exception.InvalidLoginException;
import com.gumasaje.copybara.member.domain.Member;
import com.gumasaje.copybara.member.repository.MemberRepository;
import com.gumasaje.copybara.snippet.domain.Snippet;
import com.gumasaje.copybara.snippet.repository.SnippetRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final MemberRepository memberRepository;
    private final SnippetRepository snippetRepository;

    public CategoryService(
            CategoryRepository categoryRepository,
            MemberRepository memberRepository,
            SnippetRepository snippetRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.memberRepository = memberRepository;
        this.snippetRepository = snippetRepository;
    }

    public CategoryResponse create(Long memberId, CategoryCreateRequest request) {
        validateDuplicateName(memberId, request.name());

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new InvalidLoginException("인증된 회원 정보를 찾을 수 없습니다."));

        Category category = categoryRepository.save(new Category(member, request.name().trim()));
        return toResponse(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories(Long memberId) {
        return categoryRepository.findAllByMemberIdOrderByCreatedAtAsc(memberId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CategoryResponse update(Long memberId, Long categoryId, CategoryCreateRequest request) {
        Category category = findOwnedCategory(memberId, categoryId);
        validateDuplicateName(memberId, request.name(), categoryId);
        category.updateName(request.name().trim());
        return toResponse(category);
    }

    public void delete(Long memberId, Long categoryId) {
        Category category = findOwnedCategory(memberId, categoryId);
        List<Snippet> snippets = snippetRepository.findAllByMemberIdAndCategoryIdOrderByUpdatedAtDesc(memberId, categoryId);
        snippets.forEach(Snippet::clearCategory);
        categoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public Category findOwnedCategory(Long memberId, Long categoryId) {
        return categoryRepository.findByIdAndMemberId(categoryId, memberId)
                .orElseThrow(() -> new CategoryNotFoundException("해당 카테고리를 찾을 수 없습니다."));
    }

    public CategorySummaryResponse toSummaryResponse(Category category) {
        return new CategorySummaryResponse(category.getId(), category.getName());
    }

    private void validateDuplicateName(Long memberId, String name) {
        if (categoryRepository.existsByMemberIdAndNameIgnoreCase(memberId, name.trim())) {
            throw new DuplicateCategoryNameException("이미 사용 중인 카테고리 이름입니다.");
        }
    }

    private void validateDuplicateName(Long memberId, String name, Long categoryId) {
        if (categoryRepository.existsByMemberIdAndNameIgnoreCaseAndIdNot(memberId, name.trim(), categoryId)) {
            throw new DuplicateCategoryNameException("이미 사용 중인 카테고리 이름입니다.");
        }
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                snippetRepository.countByMemberIdAndCategoryId(category.getMember().getId(), category.getId()),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
