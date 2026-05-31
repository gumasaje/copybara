package com.gumasaje.copybara.analysis.repository;

import com.gumasaje.copybara.analysis.domain.SnippetAnalysis;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SnippetAnalysisRepository extends JpaRepository<SnippetAnalysis, Long> {

    Optional<SnippetAnalysis> findBySnippetId(Long snippetId);

    void deleteBySnippetId(Long snippetId);
}
