package com.gumasaje.copybara.snippet.repository;

import com.gumasaje.copybara.snippet.domain.Snippet;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SnippetRepository extends JpaRepository<Snippet, Long> {

    List<Snippet> findAllByMemberIdOrderByUpdatedAtDesc(Long memberId);

    @Query("""
            select distinct s
            from Snippet s
            left join s.tags t
            where s.member.id = :memberId
              and (
                :keyword is null
                or lower(s.title) like lower(concat('%', :keyword, '%'))
                or lower(s.content) like lower(concat('%', :keyword, '%'))
                or lower(s.description) like lower(concat('%', :keyword, '%'))
              )
              and (:normalizedTag is null or t.normalizedName = :normalizedTag)
            order by s.updatedAt desc
            """)
    List<Snippet> searchMySnippets(
            @Param("memberId") Long memberId,
            @Param("keyword") String keyword,
            @Param("normalizedTag") String normalizedTag
    );

    Optional<Snippet> findByIdAndMemberId(Long id, Long memberId);
}
