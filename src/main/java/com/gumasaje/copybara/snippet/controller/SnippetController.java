package com.gumasaje.copybara.snippet.controller;

import com.gumasaje.copybara.auth.service.AuthMember;
import com.gumasaje.copybara.snippet.dto.SnippetCreateRequest;
import com.gumasaje.copybara.snippet.dto.SnippetDetailResponse;
import com.gumasaje.copybara.snippet.dto.SnippetSummaryResponse;
import com.gumasaje.copybara.snippet.service.SnippetService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/snippets")
public class SnippetController {

    private final SnippetService snippetService;

    public SnippetController(SnippetService snippetService) {
        this.snippetService = snippetService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SnippetDetailResponse create(Authentication authentication, @Valid @RequestBody SnippetCreateRequest request) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return snippetService.create(authMember.memberId(), request);
    }

    @GetMapping
    public List<SnippetSummaryResponse> getMySnippets(Authentication authentication) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return snippetService.getMySnippets(authMember.memberId());
    }

    @GetMapping("/{snippetId}")
    public SnippetDetailResponse getMySnippet(Authentication authentication, @PathVariable Long snippetId) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return snippetService.getMySnippet(authMember.memberId(), snippetId);
    }

    @PutMapping("/{snippetId}")
    public SnippetDetailResponse update(Authentication authentication, @PathVariable Long snippetId, @Valid @RequestBody SnippetCreateRequest request) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return snippetService.update(authMember.memberId(), snippetId, request);
    }

    @DeleteMapping("/{snippetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable Long snippetId) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        snippetService.delete(authMember.memberId(), snippetId);
    }
}
