package com.gumasaje.copybara.memo.repository;

import com.gumasaje.copybara.memo.domain.Memo;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemoRepository extends JpaRepository<Memo, Long> {

    List<Memo> findAllBySnippetIdOrderByCreatedAtAsc(Long snippetId);

    java.util.Optional<Memo> findByIdAndSnippetId(Long memoId, Long snippetId);
}
