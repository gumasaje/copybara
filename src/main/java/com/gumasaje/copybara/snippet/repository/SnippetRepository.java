package com.gumasaje.copybara.snippet.repository;

import com.gumasaje.copybara.snippet.domain.Snippet;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SnippetRepository extends JpaRepository<Snippet, Long> {

    List<Snippet> findAllByMemberIdAndDeletedAtIsNullOrderByUpdatedAtDesc(Long memberId);

    List<Snippet> findAllByMemberIdAndCategoryIdAndDeletedAtIsNullOrderByUpdatedAtDesc(Long memberId, Long categoryId);

    List<Snippet> findAllByMemberIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(Long memberId);

    long countByMemberIdAndCategoryIdAndDeletedAtIsNull(Long memberId, Long categoryId);

    @Query("""
            select distinct s
            from Snippet s
            left join s.tags t
            where s.member.id = :memberId
              and s.deletedAt is null
              and (:categoryId is null or s.category.id = :categoryId)
              and (
                :keyword is null
                or lower(s.title) like lower(concat('%', :keyword, '%'))
                or lower(s.content) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(s.notes, '')) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(s.language, '')) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(t.name, '')) like lower(concat('%', :keyword, '%'))
              )
              and (:normalizedTag is null or t.normalizedName = :normalizedTag)
            order by s.updatedAt desc
            """)
    List<Snippet> searchMySnippets(
            @Param("memberId") Long memberId,
            @Param("categoryId") Long categoryId,
            @Param("keyword") String keyword,
            @Param("normalizedTag") String normalizedTag
    );

    Optional<Snippet> findByIdAndMemberIdAndDeletedAtIsNull(Long id, Long memberId);

    Optional<Snippet> findByIdAndMemberIdAndDeletedAtIsNotNull(Long id, Long memberId);
}
