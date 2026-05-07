package com.gumasaje.copybara.attachment.service;

import com.gumasaje.copybara.attachment.domain.Attachment;
import com.gumasaje.copybara.attachment.dto.AttachmentDownload;
import com.gumasaje.copybara.attachment.dto.AttachmentResponse;
import com.gumasaje.copybara.attachment.repository.AttachmentRepository;
import com.gumasaje.copybara.common.exception.AttachmentStorageException;
import com.gumasaje.copybara.common.exception.InvalidAttachmentException;
import com.gumasaje.copybara.common.exception.SnippetNotFoundException;
import com.gumasaje.copybara.snippet.domain.Snippet;
import com.gumasaje.copybara.snippet.repository.SnippetRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class AttachmentService {

    private final SnippetRepository snippetRepository;
    private final AttachmentRepository attachmentRepository;
    private final Path uploadRoot = Path.of(System.getProperty("java.io.tmpdir"), "copybara-uploads");

    public AttachmentService(SnippetRepository snippetRepository, AttachmentRepository attachmentRepository) {
        this.snippetRepository = snippetRepository;
        this.attachmentRepository = attachmentRepository;
    }

    public AttachmentResponse upload(Long memberId, Long snippetId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidAttachmentException("업로드할 파일이 필요합니다.");
        }

        Snippet snippet = getOwnedSnippet(memberId, snippetId);

        String originalName = file.getOriginalFilename() == null ? "unknown" : file.getOriginalFilename();
        String storedName = UUID.randomUUID() + "_" + originalName;
        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();

        try {
            Files.createDirectories(uploadRoot);
            Path destination = uploadRoot.resolve(storedName);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new AttachmentStorageException("첨부파일 저장 중 오류가 발생했습니다.", exception);
        }

        Attachment attachment = attachmentRepository.save(
                new Attachment(snippet, originalName, storedName, contentType, file.getSize())
        );
        return toResponse(attachment);
    }

    public void delete(Long memberId, Long snippetId, Long attachmentId) {
        Attachment attachment = getOwnedAttachment(memberId, snippetId, attachmentId);

        try {
            Files.deleteIfExists(uploadRoot.resolve(attachment.getStoredName()));
        } catch (IOException exception) {
            throw new AttachmentStorageException("첨부파일 삭제 중 오류가 발생했습니다.", exception);
        }

        attachmentRepository.delete(attachment);
    }

    @Transactional(readOnly = true)
    public AttachmentDownload download(Long memberId, Long snippetId, Long attachmentId) {
        Attachment attachment = getOwnedAttachment(memberId, snippetId, attachmentId);

        try {
            Resource resource = new UrlResource(uploadRoot.resolve(attachment.getStoredName()).toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new AttachmentStorageException(
                        "첨부파일을 읽을 수 없습니다.",
                        new IOException("Stored attachment file is missing or unreadable.")
                );
            }
            return new AttachmentDownload(
                    attachment.getOriginalName(),
                    attachment.getContentType(),
                    attachment.getFileSize(),
                    resource
            );
        } catch (IOException exception) {
            throw new AttachmentStorageException("첨부파일을 읽는 중 오류가 발생했습니다.", exception);
        }
    }

    private Snippet getOwnedSnippet(Long memberId, Long snippetId) {
        return snippetRepository.findByIdAndMemberId(snippetId, memberId)
                .orElseThrow(() -> new SnippetNotFoundException("해당 스니펫을 찾을 수 없습니다."));
    }

    private Attachment getOwnedAttachment(Long memberId, Long snippetId, Long attachmentId) {
        getOwnedSnippet(memberId, snippetId);
        return attachmentRepository.findByIdAndSnippetId(attachmentId, snippetId)
                .orElseThrow(() -> new SnippetNotFoundException("해당 첨부파일을 찾을 수 없습니다."));
    }

    public AttachmentResponse toResponse(Attachment attachment) {
        return new AttachmentResponse(
                attachment.getId(),
                attachment.getOriginalName(),
                attachment.getStoredName(),
                attachment.getContentType(),
                attachment.getFileSize(),
                attachment.getUploadedAt()
        );
    }
}
