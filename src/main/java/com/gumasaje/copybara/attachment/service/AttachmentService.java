package com.gumasaje.copybara.attachment.service;

import com.gumasaje.copybara.attachment.domain.Attachment;
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

        Snippet snippet = snippetRepository.findByIdAndMemberId(snippetId, memberId)
                .orElseThrow(() -> new SnippetNotFoundException("해당 스니펫을 찾을 수 없습니다."));

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
