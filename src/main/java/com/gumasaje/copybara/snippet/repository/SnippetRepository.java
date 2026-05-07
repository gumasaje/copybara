package com.gumasaje.copybara.snippet.repository;

import com.gumasaje.copybara.snippet.domain.Snippet;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SnippetRepository extends JpaRepository<Snippet, Long> {

    List<Snippet> findAllByMemberIdOrderByUpdatedAtDesc(Long memberId);

    Optional<Snippet> findByIdAndMemberId(Long id, Long memberId);
}
