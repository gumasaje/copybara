package com.gumasaje.copybara.snippet.controller;

import com.gumasaje.copybara.analysis.dto.SnippetAnalysisResponse;
import com.gumasaje.copybara.analysis.service.SnippetAnalysisService;
import com.gumasaje.copybara.auth.service.AuthMember;
import com.gumasaje.copybara.snippet.dto.SnippetCategoryMoveRequest;
import com.gumasaje.copybara.snippet.dto.SnippetCreateRequest;
import com.gumasaje.copybara.snippet.dto.SnippetDetailResponse;
import com.gumasaje.copybara.snippet.dto.SnippetFavoriteRequest;
import com.gumasaje.copybara.snippet.dto.SnippetNotesRequest;
import com.gumasaje.copybara.snippet.dto.SnippetNotesResponse;
import com.gumasaje.copybara.snippet.dto.SnippetSummaryResponse;
import com.gumasaje.copybara.snippet.service.SnippetService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/snippets")
public class SnippetController {

    private final SnippetService snippetService;
    private final SnippetAnalysisService snippetAnalysisService;

    public SnippetController(
            SnippetService snippetService,
            SnippetAnalysisService snippetAnalysisService
    ) {
        this.snippetService = snippetService;
        this.snippetAnalysisService = snippetAnalysisService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SnippetDetailResponse create(
            @AuthenticationPrincipal AuthMember authMember,
            @Valid @RequestBody SnippetCreateRequest request
    ) {
        return snippetService.create(authMember.memberId(), request);
    }

    @GetMapping
    public List<SnippetSummaryResponse> getMySnippets(
            @AuthenticationPrincipal AuthMember authMember,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Long categoryId
    ) {
        return snippetService.getMySnippets(authMember.memberId(), keyword, tag, categoryId);
    }

    @GetMapping("/{snippetId}")
    public SnippetDetailResponse getMySnippet(
            @AuthenticationPrincipal AuthMember authMember,
            @PathVariable Long snippetId
    ) {
        return snippetService.getMySnippet(authMember.memberId(), snippetId);
    }

    @GetMapping("/trash")
    public List<SnippetSummaryResponse> getTrashSnippets(@AuthenticationPrincipal AuthMember authMember) {
        return snippetService.getTrashSnippets(authMember.memberId());
    }

    @GetMapping("/trash/{snippetId}")
    public SnippetDetailResponse getTrashSnippet(
            @AuthenticationPrincipal AuthMember authMember,
            @PathVariable Long snippetId
    ) {
        return snippetService.getTrashSnippet(authMember.memberId(), snippetId);
    }

    @PutMapping("/{snippetId}")
    public SnippetDetailResponse update(
            @AuthenticationPrincipal AuthMember authMember,
            @PathVariable Long snippetId,
            @Valid @RequestBody SnippetCreateRequest request
    ) {
        return snippetService.update(authMember.memberId(), snippetId, request);
    }

    @PatchMapping("/{snippetId}/category")
    public SnippetDetailResponse moveCategory(
            @AuthenticationPrincipal AuthMember authMember,
            @PathVariable Long snippetId,
            @RequestBody SnippetCategoryMoveRequest request
    ) {
        return snippetService.moveCategory(authMember.memberId(), snippetId, request);
    }

    @DeleteMapping("/{snippetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthMember authMember, @PathVariable Long snippetId) {
        snippetService.delete(authMember.memberId(), snippetId);
    }

    @PatchMapping("/{snippetId}/restore")
    public SnippetDetailResponse restore(
            @AuthenticationPrincipal AuthMember authMember,
            @PathVariable Long snippetId
    ) {
        return snippetService.restore(authMember.memberId(), snippetId);
    }

    @DeleteMapping("/{snippetId}/permanent")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePermanently(@AuthenticationPrincipal AuthMember authMember, @PathVariable Long snippetId) {
        snippetService.deletePermanently(authMember.memberId(), snippetId);
    }

    @PutMapping("/{snippetId}/favorite")
    public SnippetDetailResponse updateFavorite(
            @AuthenticationPrincipal AuthMember authMember,
            @PathVariable Long snippetId,
            @Valid @RequestBody SnippetFavoriteRequest request
    ) {
        return snippetService.updateFavorite(authMember.memberId(), snippetId, request);
    }

    @PutMapping("/{snippetId}/notes")
    public SnippetNotesResponse updateNotes(
            @AuthenticationPrincipal AuthMember authMember,
            @PathVariable Long snippetId,
            @Valid @RequestBody SnippetNotesRequest request
    ) {
        return snippetService.updateNotes(authMember.memberId(), snippetId, request);
    }

    @PostMapping("/{snippetId}/analysis")
    public SnippetAnalysisResponse analyze(@AuthenticationPrincipal AuthMember authMember, @PathVariable Long snippetId) {
        return snippetAnalysisService.analyze(authMember.memberId(), snippetId);
    }

    @GetMapping("/{snippetId}/analysis")
    public SnippetAnalysisResponse getAnalysis(@AuthenticationPrincipal AuthMember authMember, @PathVariable Long snippetId) {
        return snippetAnalysisService.getAnalysis(authMember.memberId(), snippetId);
    }
}
