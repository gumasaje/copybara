package com.gumasaje.copybara.analysis.domain;

import com.gumasaje.copybara.snippet.domain.Snippet;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "snippet_analyses")
public class SnippetAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "snippet_id", nullable = false, unique = true)
    private Snippet snippet;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String keyPoints;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String suggestedTags;

    @Column(length = 50)
    private String provider;

    @Column(length = 100)
    private String model;

    @Column(length = 100)
    private String promptVersion;

    private LocalDateTime analyzedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected SnippetAnalysis() {
    }

    public SnippetAnalysis(
            Snippet snippet,
            String summary,
            String keyPoints,
            String suggestedTags,
            String provider,
            String model,
            String promptVersion
    ) {
        this.snippet = snippet;
        this.summary = summary;
        this.keyPoints = keyPoints;
        this.suggestedTags = suggestedTags;
        this.provider = provider;
        this.model = model;
        this.promptVersion = promptVersion;
        this.analyzedAt = LocalDateTime.now();
    }

    public void update(String summary, String keyPoints, String suggestedTags, String provider, String model, String promptVersion) {
        this.summary = summary;
        this.keyPoints = keyPoints;
        this.suggestedTags = suggestedTags;
        this.provider = provider;
        this.model = model;
        this.promptVersion = promptVersion;
        this.analyzedAt = LocalDateTime.now();
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Snippet getSnippet() {
        return snippet;
    }

    public String getSummary() {
        return summary;
    }

    public String getKeyPoints() {
        return keyPoints;
    }

    public String getSuggestedTags() {
        return suggestedTags;
    }

    public String getProvider() {
        return provider;
    }

    public String getModel() {
        return model;
    }

    public String getPromptVersion() {
        return promptVersion;
    }

    public LocalDateTime getAnalyzedAt() {
        return analyzedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
