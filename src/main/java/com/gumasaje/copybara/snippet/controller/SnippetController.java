package com.gumasaje.copybara.snippet.controller;

import com.gumasaje.copybara.analysis.dto.SnippetAnalysisResponse;
import com.gumasaje.copybara.attachment.dto.AttachmentDownload;
import com.gumasaje.copybara.analysis.service.SnippetAnalysisService;
import com.gumasaje.copybara.attachment.dto.AttachmentResponse;
import com.gumasaje.copybara.attachment.service.AttachmentService;
import com.gumasaje.copybara.auth.service.AuthMember;
import com.gumasaje.copybara.memo.dto.MemoCreateRequest;
import com.gumasaje.copybara.memo.dto.MemoResponse;
import com.gumasaje.copybara.memo.service.MemoService;
import com.gumasaje.copybara.snippet.dto.SnippetCreateRequest;
import com.gumasaje.copybara.snippet.dto.SnippetDetailResponse;
import com.gumasaje.copybara.snippet.dto.SnippetFavoriteRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
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
    private final MemoService memoService;

    public SnippetController(
            SnippetService snippetService,
            AttachmentService attachmentService,
            SnippetAnalysisService snippetAnalysisService,
            MemoService memoService
    ) {
        this.snippetService = snippetService;
        this.attachmentService = attachmentService;
        this.snippetAnalysisService = snippetAnalysisService;
        this.memoService = memoService;
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
    public List<SnippetSummaryResponse> getMySnippets(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tag
    ) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return snippetService.getMySnippets(authMember.memberId(), keyword, tag);
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

    @PutMapping("/{snippetId}/favorite")
    public SnippetDetailResponse updateFavorite(
            Authentication authentication,
            @PathVariable Long snippetId,
            @Valid @RequestBody SnippetFavoriteRequest request
    ) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return snippetService.updateFavorite(authMember.memberId(), snippetId, request);
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

    @PostMapping("/{snippetId}/memos")
    @ResponseStatus(HttpStatus.CREATED)
    public MemoResponse createMemo(
            Authentication authentication,
            @PathVariable Long snippetId,
            @Valid @RequestBody MemoCreateRequest request
    ) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return memoService.create(authMember.memberId(), snippetId, request);
    }

    @GetMapping("/{snippetId}/memos")
    public List<MemoResponse> getMemos(Authentication authentication, @PathVariable Long snippetId) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return memoService.getMemos(authMember.memberId(), snippetId);
    }

    @PutMapping("/{snippetId}/memos/{memoId}")
    public MemoResponse updateMemo(
            Authentication authentication,
            @PathVariable Long snippetId,
            @PathVariable Long memoId,
            @Valid @RequestBody MemoCreateRequest request
    ) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        return memoService.update(authMember.memberId(), snippetId, memoId, request);
    }

    @DeleteMapping("/{snippetId}/memos/{memoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMemo(
            Authentication authentication,
            @PathVariable Long snippetId,
            @PathVariable Long memoId
    ) {
        AuthMember authMember = (AuthMember) authentication.getPrincipal();
        memoService.delete(authMember.memberId(), snippetId, memoId);
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
