package com.gumasaje.copybara.snippet.controller;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.gumasaje.copybara.tag.repository.TagRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class SnippetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TagRepository tagRepository;

    @Test
    void createSnippetReturnsCreatedWhenTokenIsValid() throws Exception {
        String accessToken = signupAndLogin("snippet-create@example.com", "snippet-user");

        String requestBody = """
                {
                  "title": "JWT filter example",
                  "content": "public class Example {}",
                  "language": "Java",
                  "description": "JWT 인증 필터 예제",
                  "tags": ["Spring", "Security"]
                }
                """;

        mockMvc.perform(post("/api/snippets")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.snippetId").isNumber())
                .andExpect(jsonPath("$.title").value("JWT filter example"))
                .andExpect(jsonPath("$.language").value("Java"))
                .andExpect(jsonPath("$.description").value("JWT 인증 필터 예제"))
                .andExpect(jsonPath("$.tags[0]").value("Spring"))
                .andExpect(jsonPath("$.tags[1]").value("Security"))
                .andExpect(jsonPath("$.attachments").isArray());
    }

    @Test
    void createSnippetReturnsBadRequestWhenTitleIsBlank() throws Exception {
        String accessToken = signupAndLogin("snippet-validation@example.com", "snippet-validation-user");

        String requestBody = """
                {
                  "title": "",
                  "content": "validation-content",
                  "language": "Java",
                  "description": "validation-description",
                  "tags": ["Java"]
                }
                """;

        mockMvc.perform(post("/api/snippets")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value("제목은 필수입니다."));
    }

    @Test
    void analyzeSnippetCreatesAndReturnsAnalysis() throws Exception {
        String accessToken = signupAndLogin("snippet-analysis@example.com", "snippet-analysis-user");
        Long snippetId = createSnippet(accessToken, "JWT snippet", "JWT token validation example");

        mockMvc.perform(post("/api/snippets/{snippetId}/analysis", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.analysisId").isNumber())
                .andExpect(jsonPath("$.snippetId").value(snippetId))
                .andExpect(jsonPath("$.summary").isString())
                .andExpect(jsonPath("$.keyPoints[0]").isString())
                .andExpect(jsonPath("$.suggestedTags[0]").isString());
    }

    @Test
    void getAnalysisReturnsStoredAnalysis() throws Exception {
        String accessToken = signupAndLogin("snippet-analysis-read@example.com", "snippet-analysis-read-user");
        Long snippetId = createSnippet(accessToken, "Analysis snippet", "public class Analysis {} // jwt");

        mockMvc.perform(post("/api/snippets/{snippetId}/analysis", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/snippets/{snippetId}/analysis", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.snippetId").value(snippetId))
                .andExpect(jsonPath("$.summary").isString())
                .andExpect(jsonPath("$.keyPoints[0]").isString());
    }

    @Test
    void getAnalysisReturnsNotFoundWhenAnalysisDoesNotExist() throws Exception {
        String accessToken = signupAndLogin("snippet-analysis-empty@example.com", "snippet-analysis-empty-user");
        Long snippetId = createSnippet(accessToken, "No analysis snippet", "no analysis yet");

        mockMvc.perform(get("/api/snippets/{snippetId}/analysis", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SNIPPET_ANALYSIS_NOT_FOUND"));
    }

    @Test
    void uploadAttachmentStoresMetadataAndAppearsInSnippetDetail() throws Exception {
        String accessToken = signupAndLogin("snippet-attachment@example.com", "snippet-attachment-user");
        Long snippetId = createSnippet(accessToken, "Attachment snippet", "attachment-content");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "example.txt",
                "text/plain",
                "hello copybara".getBytes()
        );

        mockMvc.perform(multipart("/api/snippets/{snippetId}/attachments", snippetId)
                        .file(file)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.attachmentId").isNumber())
                .andExpect(jsonPath("$.originalName").value("example.txt"))
                .andExpect(jsonPath("$.contentType").value("text/plain"))
                .andExpect(jsonPath("$.fileSize").value(14));

        mockMvc.perform(get("/api/snippets/{snippetId}", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attachments[0].originalName").value("example.txt"))
                .andExpect(jsonPath("$.attachments[0].contentType").value("text/plain"));
    }

    @Test
    void deleteAttachmentReturnsNoContentWhenAttachmentBelongsToOwnedSnippet() throws Exception {
        String accessToken = signupAndLogin("snippet-attachment-delete@example.com", "snippet-attachment-delete-user");
        Long snippetId = createSnippet(accessToken, "Attachment delete snippet", "attachment delete target");
        Long attachmentId = uploadAttachment(accessToken, snippetId, "delete-example.txt", "delete copybara");

        mockMvc.perform(delete("/api/snippets/{snippetId}/attachments/{attachmentId}", snippetId, attachmentId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/snippets/{snippetId}", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attachments").isEmpty());
    }

    @Test
    void deleteAttachmentReturnsNotFoundWhenSnippetDoesNotBelongToAuthenticatedMember() throws Exception {
        String ownerToken = signupAndLogin("snippet-attachment-delete-owner@example.com", "snippet-attachment-delete-owner");
        Long snippetId = createSnippet(ownerToken, "Attachment delete owner snippet", "attachment delete owner target");
        Long attachmentId = uploadAttachment(ownerToken, snippetId, "owner-example.txt", "owner copybara");
        String otherUserToken = signupAndLogin("snippet-attachment-delete-other@example.com", "snippet-attachment-delete-other");

        mockMvc.perform(delete("/api/snippets/{snippetId}/attachments/{attachmentId}", snippetId, attachmentId)
                        .header("Authorization", "Bearer " + otherUserToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SNIPPET_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("해당 첨부파일을 찾을 수 없습니다."));
    }

    @Test
    void downloadAttachmentReturnsFileWhenAttachmentBelongsToOwnedSnippet() throws Exception {
        String accessToken = signupAndLogin("snippet-attachment-download@example.com", "snippet-attachment-download-user");
        Long snippetId = createSnippet(accessToken, "Attachment download snippet", "attachment download target");
        Long attachmentId = uploadAttachment(accessToken, snippetId, "download-example.txt", "download copybara");

        mockMvc.perform(get("/api/snippets/{snippetId}/attachments/{attachmentId}/download", snippetId, attachmentId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("attachment")))
                .andExpect(header().string("Content-Disposition", containsString("download-example.txt")))
                .andExpect(content().string("download copybara"));
    }

    @Test
    void downloadAttachmentReturnsNotFoundWhenSnippetDoesNotBelongToAuthenticatedMember() throws Exception {
        String ownerToken = signupAndLogin("snippet-attachment-download-owner@example.com", "snippet-attachment-download-owner");
        Long snippetId = createSnippet(ownerToken, "Attachment download owner snippet", "attachment download owner target");
        Long attachmentId = uploadAttachment(ownerToken, snippetId, "download-owner.txt", "owner download");
        String otherUserToken = signupAndLogin("snippet-attachment-download-other@example.com", "snippet-attachment-download-other");

        mockMvc.perform(get("/api/snippets/{snippetId}/attachments/{attachmentId}/download", snippetId, attachmentId)
                        .header("Authorization", "Bearer " + otherUserToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SNIPPET_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("해당 첨부파일을 찾을 수 없습니다."));
    }

    @Test
    void createCommentReturnsCreatedWhenSnippetBelongsToAuthenticatedMember() throws Exception {
        String accessToken = signupAndLogin("snippet-comment@example.com", "snippet-comment-user");
        Long snippetId = createSnippet(accessToken, "Comment snippet", "comment target");

        String requestBody = """
                {
                  "content": "나중에 다시 볼 포인트"
                }
                """;

        mockMvc.perform(post("/api/snippets/{snippetId}/comments", snippetId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.commentId").isNumber())
                .andExpect(jsonPath("$.snippetId").value(snippetId))
                .andExpect(jsonPath("$.memberId").isNumber())
                .andExpect(jsonPath("$.nickname").value("snippet-comment-user"))
                .andExpect(jsonPath("$.content").value("나중에 다시 볼 포인트"))
                .andExpect(jsonPath("$.createdAt").isString())
                .andExpect(jsonPath("$.updatedAt").isString());
    }

    @Test
    void createCommentReturnsBadRequestWhenContentIsBlank() throws Exception {
        String accessToken = signupAndLogin("snippet-comment-validation@example.com", "snippet-comment-validation-user");
        Long snippetId = createSnippet(accessToken, "Comment validation snippet", "comment validation target");

        String requestBody = """
                {
                  "content": ""
                }
                """;

        mockMvc.perform(post("/api/snippets/{snippetId}/comments", snippetId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value("댓글 내용은 필수입니다."));
    }

    @Test
    void getCommentsReturnsCommentsForOwnedSnippet() throws Exception {
        String accessToken = signupAndLogin("snippet-comment-list@example.com", "snippet-comment-list-user");
        Long snippetId = createSnippet(accessToken, "Comment list snippet", "comment list target");

        createComment(accessToken, snippetId, "첫 번째 메모");
        createComment(accessToken, snippetId, "두 번째 메모");

        mockMvc.perform(get("/api/snippets/{snippetId}/comments", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].content").value("첫 번째 메모"))
                .andExpect(jsonPath("$[0].nickname").value("snippet-comment-list-user"))
                .andExpect(jsonPath("$[1].content").value("두 번째 메모"));
    }

    @Test
    void updateCommentReturnsUpdatedCommentWhenCommentBelongsToOwnedSnippet() throws Exception {
        String accessToken = signupAndLogin("snippet-comment-update@example.com", "snippet-comment-update-user");
        Long snippetId = createSnippet(accessToken, "Comment update snippet", "comment update target");
        Long commentId = createComment(accessToken, snippetId, "수정 전 메모");

        String requestBody = """
                {
                  "content": "수정 후 메모"
                }
                """;

        mockMvc.perform(put("/api/snippets/{snippetId}/comments/{commentId}", snippetId, commentId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.commentId").value(commentId))
                .andExpect(jsonPath("$.snippetId").value(snippetId))
                .andExpect(jsonPath("$.nickname").value("snippet-comment-update-user"))
                .andExpect(jsonPath("$.content").value("수정 후 메모"))
                .andExpect(jsonPath("$.updatedAt").isString());

        mockMvc.perform(get("/api/snippets/{snippetId}/comments", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].content").value("수정 후 메모"));
    }

    @Test
    void updateCommentReturnsNotFoundWhenSnippetDoesNotBelongToAuthenticatedMember() throws Exception {
        String ownerToken = signupAndLogin("snippet-comment-update-owner@example.com", "snippet-comment-update-owner");
        Long snippetId = createSnippet(ownerToken, "Comment update owner snippet", "comment update owner target");
        Long commentId = createComment(ownerToken, snippetId, "소유자 댓글");
        String otherUserToken = signupAndLogin("snippet-comment-update-other@example.com", "snippet-comment-update-other");

        String requestBody = """
                {
                  "content": "다른 사용자의 수정 시도"
                }
                """;

        mockMvc.perform(put("/api/snippets/{snippetId}/comments/{commentId}", snippetId, commentId)
                        .header("Authorization", "Bearer " + otherUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SNIPPET_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("해당 댓글을 찾을 수 없습니다."));
    }

    @Test
    void deleteCommentReturnsNoContentWhenCommentBelongsToOwnedSnippet() throws Exception {
        String accessToken = signupAndLogin("snippet-comment-delete@example.com", "snippet-comment-delete-user");
        Long snippetId = createSnippet(accessToken, "Comment delete snippet", "comment delete target");
        Long commentId = createComment(accessToken, snippetId, "삭제할 메모");

        mockMvc.perform(delete("/api/snippets/{snippetId}/comments/{commentId}", snippetId, commentId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/snippets/{snippetId}/comments", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void getMySnippetsReturnsOnlyAuthenticatedMembersSnippets() throws Exception {
        String accessToken = signupAndLogin("snippet-list@example.com", "snippet-list-user");

        createSnippet(accessToken, "First snippet", "content-1");
        createSnippet(accessToken, "Second snippet", "content-2");

        mockMvc.perform(get("/api/snippets")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].snippetId").isNumber())
                .andExpect(jsonPath("$[0].title").value("Second snippet"))
                .andExpect(jsonPath("$[0].tags[0]").value("Java"))
                .andExpect(jsonPath("$[1].title").value("First snippet"));
    }

    @Test
    void getMySnippetReturnsDetailWhenSnippetBelongsToAuthenticatedMember() throws Exception {
        String accessToken = signupAndLogin("snippet-detail@example.com", "snippet-detail-user");
        Long snippetId = createSnippet(accessToken, "Detail snippet", "System.out.println('hello');");

        mockMvc.perform(get("/api/snippets/{snippetId}", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.snippetId").value(snippetId))
                .andExpect(jsonPath("$.title").value("Detail snippet"))
                .andExpect(jsonPath("$.content").value("System.out.println('hello');"))
                .andExpect(jsonPath("$.tags[0]").value("Java"));
    }

    @Test
    void updateSnippetReturnsUpdatedDetailWhenSnippetBelongsToAuthenticatedMember() throws Exception {
        String accessToken = signupAndLogin("snippet-update@example.com", "snippet-update-user");
        Long snippetId = createSnippet(accessToken, "Old title", "old-content");

        String updateRequestBody = """
                {
                  "title": "Updated title",
                  "content": "updated-content",
                  "language": "Kotlin",
                  "description": "updated-description",
                  "tags": ["Kotlin", "Backend"]
                }
                """;

        mockMvc.perform(put("/api/snippets/{snippetId}", snippetId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.snippetId").value(snippetId))
                .andExpect(jsonPath("$.title").value("Updated title"))
                .andExpect(jsonPath("$.content").value("updated-content"))
                .andExpect(jsonPath("$.language").value("Kotlin"))
                .andExpect(jsonPath("$.description").value("updated-description"))
                .andExpect(jsonPath("$.tags", containsInAnyOrder("Kotlin", "Backend")));
    }

    @Test
    void createSnippetReusesTagWhenNameDiffersOnlyByCase() throws Exception {
        String accessToken = signupAndLogin("snippet-tag-normalize@example.com", "snippet-tag-normalize-user");

        createSnippet(accessToken, "Upper tag snippet", "upper-tag-content");

        String requestBody = """
                {
                  "title": "Lower tag snippet",
                  "content": "lower-tag-content",
                  "language": "Java",
                  "description": "lower-tag-description",
                  "tags": ["java"]
                }
                """;

        mockMvc.perform(post("/api/snippets")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tags[0]").value("Java"));

        org.assertj.core.api.Assertions.assertThat(tagRepository.findAllByNormalizedNameIn(List.of("java")))
                .hasSize(1);
    }

    @Test
    void deleteSnippetReturnsNoContentWhenSnippetBelongsToAuthenticatedMember() throws Exception {
        String accessToken = signupAndLogin("snippet-delete@example.com", "snippet-delete-user");
        Long snippetId = createSnippet(accessToken, "Delete title", "delete-content");

        mockMvc.perform(delete("/api/snippets/{snippetId}", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/snippets/{snippetId}", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SNIPPET_NOT_FOUND"));
    }

    @Test
    void deleteSnippetReturnsNoContentWhenSnippetHasChildRecords() throws Exception {
        String accessToken = signupAndLogin("snippet-delete-children@example.com", "snippet-delete-children-user");
        Long snippetId = createSnippet(accessToken, "Delete children title", "delete-children-content");
        createComment(accessToken, snippetId, "삭제될 댓글");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "delete-child.txt",
                "text/plain",
                "delete child".getBytes()
        );

        mockMvc.perform(multipart("/api/snippets/{snippetId}/attachments", snippetId)
                        .file(file)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/snippets/{snippetId}/analysis", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/snippets/{snippetId}", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/snippets/{snippetId}", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SNIPPET_NOT_FOUND"));
    }

    @Test
    void getMySnippetReturnsNotFoundWhenSnippetDoesNotBelongToAuthenticatedMember() throws Exception {
        String ownerToken = signupAndLogin("owner@example.com", "owner-user");
        Long snippetId = createSnippet(ownerToken, "Owner snippet", "owner-content");

        String otherUserToken = signupAndLogin("other@example.com", "other-user");

        mockMvc.perform(get("/api/snippets/{snippetId}", snippetId)
                        .header("Authorization", "Bearer " + otherUserToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SNIPPET_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("해당 스니펫을 찾을 수 없습니다."));
    }

    private String signupAndLogin(String email, String nickname) throws Exception {
        String signupRequestBody = """
                {
                  "email": "%s",
                  "password": "password123",
                  "nickname": "%s"
                }
                """.formatted(email, nickname);

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupRequestBody))
                .andExpect(status().isCreated());

        String loginRequestBody = """
                {
                  "email": "%s",
                  "password": "password123"
                }
                """.formatted(email);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginRequestBody))
                .andExpect(status().isOk())
                .andReturn();

        return extractAccessToken(loginResult.getResponse().getContentAsString());
    }

    private Long createSnippet(String accessToken, String title, String content) throws Exception {
        String requestBody = """
                {
                  "title": "%s",
                  "content": "%s",
                  "language": "Java",
                  "description": "test-description",
                  "tags": ["Java"]
                }
                """.formatted(title, content);

        MvcResult result = mockMvc.perform(post("/api/snippets")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andReturn();

        return extractSnippetId(result.getResponse().getContentAsString());
    }

    private Long createComment(String accessToken, Long snippetId, String content) throws Exception {
        String requestBody = """
                {
                  "content": "%s"
                }
                """.formatted(content);

        MvcResult result = mockMvc.perform(post("/api/snippets/{snippetId}/comments", snippetId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andReturn();

        return extractCommentId(result.getResponse().getContentAsString());
    }

    private Long uploadAttachment(String accessToken, Long snippetId, String originalName, String content) throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                originalName,
                "text/plain",
                content.getBytes()
        );

        MvcResult result = mockMvc.perform(multipart("/api/snippets/{snippetId}/attachments", snippetId)
                        .file(file)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isCreated())
                .andReturn();

        return extractAttachmentId(result.getResponse().getContentAsString());
    }

    private String extractAccessToken(String responseBody) {
        String marker = "\"accessToken\":\"";
        int start = responseBody.indexOf(marker) + marker.length();
        int end = responseBody.indexOf('"', start);
        return responseBody.substring(start, end);
    }

    private Long extractSnippetId(String responseBody) {
        return extractLongValue(responseBody, "snippetId");
    }

    private Long extractCommentId(String responseBody) {
        return extractLongValue(responseBody, "commentId");
    }

    private Long extractAttachmentId(String responseBody) {
        return extractLongValue(responseBody, "attachmentId");
    }

    private Long extractLongValue(String responseBody, String fieldName) {
        String marker = "\"" + fieldName + "\":";
        int start = responseBody.indexOf(marker) + marker.length();
        int end = responseBody.indexOf(',', start);
        if (end == -1) {
            end = responseBody.indexOf('}', start);
        }
        return Long.parseLong(responseBody.substring(start, end));
    }
}
