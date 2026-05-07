package com.gumasaje.copybara.attachment.repository;

import com.gumasaje.copybara.attachment.domain.Attachment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findAllBySnippetIdOrderByUploadedAtAsc(Long snippetId);
}
