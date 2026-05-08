package com.gumasaje.copybara.category.repository;

import com.gumasaje.copybara.category.domain.Category;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByMemberIdOrderByCreatedAtAsc(Long memberId);

    Optional<Category> findByIdAndMemberId(Long categoryId, Long memberId);

    boolean existsByMemberIdAndNameIgnoreCase(Long memberId, String name);

    boolean existsByMemberIdAndNameIgnoreCaseAndIdNot(Long memberId, String name, Long categoryId);
}
