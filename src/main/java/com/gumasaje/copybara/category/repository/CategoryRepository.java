package com.gumasaje.copybara.category.repository;

import com.gumasaje.copybara.category.domain.Category;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByMemberIdOrderByCreatedAtAsc(Long memberId);

    List<Category> findAllByMemberIdOrderBySortOrderAscCreatedAtAsc(Long memberId);

    Optional<Category> findByIdAndMemberId(Long categoryId, Long memberId);

    boolean existsByMemberIdAndNameIgnoreCase(Long memberId, String name);

    boolean existsByMemberIdAndNameIgnoreCaseAndIdNot(Long memberId, String name, Long categoryId);

    @Query("select coalesce(max(c.sortOrder), 0) from Category c where c.member.id = :memberId")
    Integer findMaxSortOrderByMemberId(@Param("memberId") Long memberId);
}
