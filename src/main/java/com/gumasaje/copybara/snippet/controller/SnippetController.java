package com.gumasaje.copybara.snippet.controller;

import com.gumasaje.copybara.analysis.dto.SnippetAnalysisResponse;
import com.gumasaje.copybara.attachment.dto.AttachmentDownload;
import com.gumasaje.copybara.analysis.service.SnippetAnalysisService;
import com.gumasaje.copybara.attachment.dto.AttachmentResponse;
import com.gumasaje.copybara.attachment.service.AttachmentService;
import com.gumasaje.copybara.auth.service.AuthMember;
import com.gumasaje.copybara.comment.dto.CommentCreateRequest;
import com.gumasaje.copybara.comment.dto.CommentResponse;
import com.gumasaje.copybara.comment.service.CommentService;
import com.gumasaje.copybara.snippet.dto.SnippetCreateRequest;
import com.gumasaje.copybara.snippet.dto.SnippetDetailResponse;
import com.gumasaje.copybara.snippet.dto.SnippetSummaryResponse;
import com.gumasaje.copybara.snippet.service.SnippetService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/snippets")
public class SnippetController {

    private final SnippetService snippetService;
    private final AttachmentService attachmentService;
    private final SnippetAnalysisService snippetAnalysisService;
    private final CommentService commentService;

    public SnippetController(
            SnippetService snippetService,
            AttachmentService attachmentService,
            SnippetAnalysisService snippetAnalysisService,
            CommentService commentService
    ) {
        this.snippetService = snippetService;
        this.attachmentService = attachmentService;
        this.snippetAnalysisService = snippetAnalysisService;
        this.commentService = commentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SnippetDetailResponse create(
            Authentication authentication,
            @Valid @RequestBody SnippetCreateRequest request
    ) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return snippetService.create(authMember.memberId(), request);
    }

    @GetMapping
    public List<SnippetSummaryResponse> getMySnippets(Authentication authentication) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return snippetService.getMySnippets(authMember.memberId());
    }

    @GetMapping("/{snippetId}")
    public SnippetDetailResponse getMySnippet(
            Authentication authentication,
            @PathVariable Long snippetId
    ) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return snippetService.getMySnippet(authMember.memberId(), snippetId);
    }

    @PutMapping("/{snippetId}")
    public SnippetDetailResponse update(
            Authentication authentication,
            @PathVariable Long snippetId,
            @Valid @RequestBody SnippetCreateRequest request
    ) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return snippetService.update(authMember.memberId(), snippetId, request);
    }

    @DeleteMapping("/{snippetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable Long snippetId) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        snippetService.delete(authMember.memberId(), snippetId);
    }

    @PostMapping("/{snippetId}/attachments")
    @ResponseStatus(HttpStatus.CREATED)
    public AttachmentResponse uploadAttachment(
            Authentication authentication,
            @PathVariable Long snippetId,
            @RequestPart("file") MultipartFile file
    ) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return attachmentService.upload(authMember.memberId(), snippetId, file);
    }

    @DeleteMapping("/{snippetId}/attachments/{attachmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttachment(
            Authentication authentication,
            @PathVariable Long snippetId,
            @PathVariable Long attachmentId
    ) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        attachmentService.delete(authMember.memberId(), snippetId, attachmentId);
    }

    @GetMapping("/{snippetId}/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            Authentication authentication,
            @PathVariable Long snippetId,
            @PathVariable Long attachmentId
    ) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        AttachmentDownload download = attachmentService.download(authMember.memberId(), snippetId, attachmentId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.contentType()))
                .contentLength(download.fileSize())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(download.originalName())
                        .build()
                        .toString())
                .body(download.resource());
    }

    @PostMapping("/{snippetId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse createComment(
            Authentication authentication,
            @PathVariable Long snippetId,
            @Valid @RequestBody CommentCreateRequest request
    ) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return commentService.create(authMember.memberId(), snippetId, request);
    }

    @GetMapping("/{snippetId}/comments")
    public List<CommentResponse> getComments(Authentication authentication, @PathVariable Long snippetId) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return commentService.getComments(authMember.memberId(), snippetId);
    }

    @PutMapping("/{snippetId}/comments/{commentId}")
    public CommentResponse updateComment(
            Authentication authentication,
            @PathVariable Long snippetId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentCreateRequest request
    ) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return commentService.update(authMember.memberId(), snippetId, commentId, request);
    }

    @DeleteMapping("/{snippetId}/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            Authentication authentication,
            @PathVariable Long snippetId,
            @PathVariable Long commentId
    ) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        commentService.delete(authMember.memberId(), snippetId, commentId);
    }

    @PostMapping("/{snippetId}/analysis")
    public SnippetAnalysisResponse analyze(Authentication authentication, @PathVariable Long snippetId) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return snippetAnalysisService.analyze(authMember.memberId(), snippetId);
    }

    @GetMapping("/{snippetId}/analysis")
    public SnippetAnalysisResponse getAnalysis(Authentication authentication, @PathVariable Long snippetId) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return snippetAnalysisService.getAnalysis(authMember.memberId(), snippetId);
    }
}
