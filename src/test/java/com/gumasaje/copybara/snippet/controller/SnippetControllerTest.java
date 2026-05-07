package com.gumasaje.copybara.snippet.controller;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
    @Autowired private MockMvc mockMvc;

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
        mockMvc.perform(post("/api/snippets").header("Authorization", "Bearer " + accessToken).contentType(MediaType.APPLICATION_JSON).content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.snippetId").isNumber())
                .andExpect(jsonPath("$.title").value("JWT filter example"))
                .andExpect(jsonPath("$.tags[0]").value("Spring"))
                .andExpect(jsonPath("$.attachments").isArray());
    }

    @Test
    void uploadAttachmentStoresMetadataAndAppearsInSnippetDetail() throws Exception {
        String accessToken = signupAndLogin("snippet-attachment@example.com", "snippet-attachment-user");
        Long snippetId = createSnippet(accessToken, "Attachment snippet", "attachment-content");
        MockMultipartFile file = new MockMultipartFile("file", "example.txt", "text/plain", "hello copybara".getBytes());
        mockMvc.perform(multipart("/api/snippets/{snippetId}/attachments", snippetId).file(file).header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalName").value("example.txt"));
        mockMvc.perform(get("/api/snippets/{snippetId}", snippetId).header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attachments[0].originalName").value("example.txt"));
    }

    @Test
    void getMySnippetsReturnsOnlyAuthenticatedMembersSnippets() throws Exception {
        String accessToken = signupAndLogin("snippet-list@example.com", "snippet-list-user");
        createSnippet(accessToken, "First snippet", "content-1");
        createSnippet(accessToken, "Second snippet", "content-2");
        mockMvc.perform(get("/api/snippets").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Second snippet"))
                .andExpect(jsonPath("$[0].tags[0]").value("Java"))
                .andExpect(jsonPath("$[1].title").value("First snippet"));
    }

    @Test
    void getMySnippetReturnsDetailWhenSnippetBelongsToAuthenticatedMember() throws Exception {
        String accessToken = signupAndLogin("snippet-detail@example.com", "snippet-detail-user");
        Long snippetId = createSnippet(accessToken, "Detail snippet", "System.out.println('hello');");
        mockMvc.perform(get("/api/snippets/{snippetId}", snippetId).header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.snippetId").value(snippetId))
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
        mockMvc.perform(put("/api/snippets/{snippetId}", snippetId).header("Authorization", "Bearer " + accessToken).contentType(MediaType.APPLICATION_JSON).content(updateRequestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tags", containsInAnyOrder("Kotlin", "Backend")));
    }

    @Test
    void deleteSnippetReturnsNoContentWhenSnippetBelongsToAuthenticatedMember() throws Exception {
        String accessToken = signupAndLogin("snippet-delete@example.com", "snippet-delete-user");
        Long snippetId = createSnippet(accessToken, "Delete title", "delete-content");
        mockMvc.perform(delete("/api/snippets/{snippetId}", snippetId).header("Authorization", "Bearer " + accessToken)).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/snippets/{snippetId}", snippetId).header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SNIPPET_NOT_FOUND"));
    }

    @Test
    void getMySnippetReturnsNotFoundWhenSnippetDoesNotBelongToAuthenticatedMember() throws Exception {
        String ownerToken = signupAndLogin("owner@example.com", "owner-user");
        Long snippetId = createSnippet(ownerToken, "Owner snippet", "owner-content");
        String otherUserToken = signupAndLogin("other@example.com", "other-user");
        mockMvc.perform(get("/api/snippets/{snippetId}", snippetId).header("Authorization", "Bearer " + otherUserToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SNIPPET_NOT_FOUND"));
    }

    private String signupAndLogin(String email, String nickname) throws Exception {
        String signupRequestBody = """
                {
                  "email": "%s",
                  "password": "password123",
                  "nickname": "%s"
                }
                """.formatted(email, nickname);
        mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(signupRequestBody)).andExpect(status().isCreated());
        String loginRequestBody = """
                {
                  "email": "%s",
                  "password": "password123"
                }
                """.formatted(email);
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginRequestBody)).andExpect(status().isOk()).andReturn();
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
        MvcResult result = mockMvc.perform(post("/api/snippets").header("Authorization", "Bearer " + accessToken).contentType(MediaType.APPLICATION_JSON).content(requestBody)).andExpect(status().isCreated()).andReturn();
        return extractSnippetId(result.getResponse().getContentAsString());
    }

    private String extractAccessToken(String responseBody) {
        String marker = "\"accessToken\":\"";
        int start = responseBody.indexOf(marker) + marker.length();
        int end = responseBody.indexOf('"', start);
        return responseBody.substring(start, end);
    }

    private Long extractSnippetId(String responseBody) {
        String marker = "\"snippetId\":";
        int start = responseBody.indexOf(marker) + marker.length();
        int end = responseBody.indexOf(',', start);
        if (end == -1) end = responseBody.indexOf('}', start);
        return Long.parseLong(responseBody.substring(start, end));
    }
}
