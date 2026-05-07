package com.gumasaje.copybara.snippet.domain;

import com.gumasaje.copybara.analysis.domain.SnippetAnalysis;
import com.gumasaje.copybara.attachment.domain.Attachment;
import com.gumasaje.copybara.comment.domain.Comment;
import com.gumasaje.copybara.member.domain.Member;
import com.gumasaje.copybara.tag.domain.Tag;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "snippets")
public class Snippet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 50)
    private String language;

    @Column(length = 255)
    private String description;

    @ManyToMany
    @JoinTable(
            name = "snippet_tags",
            joinColumns = @JoinColumn(name = "snippet_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new LinkedHashSet<>();

    @OneToMany(mappedBy = "snippet", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<Attachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "snippet", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @OneToOne(mappedBy = "snippet", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private SnippetAnalysis analysis;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected Snippet() {}

    public Snippet(Member member, String title, String content, String language, String description) {
        this.member = member;
        this.title = title;
        this.content = content;
        this.language = language;
        this.description = description;
    }

    public void update(String title, String content, String language, String description) {
        this.title = title;
        this.content = content;
        this.language = language;
        this.description = description;
    }

    public void replaceTags(List<Tag> tags) {
        this.tags.clear();
        this.tags.addAll(tags);
    }

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public Member getMember() { return member; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getLanguage() { return language; }
    public String getDescription() { return description; }
    public Set<Tag> getTags() { return tags; }
    public List<Attachment> getAttachments() { return attachments; }
    public List<Comment> getComments() { return comments; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
