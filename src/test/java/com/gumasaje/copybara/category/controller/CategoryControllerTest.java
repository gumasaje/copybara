package com.gumasaje.copybara.category.controller;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createCategoryReturnsCreated() throws Exception {
        String accessToken = signupAndLogin("category-create@example.com", "category-create-user");

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "알고리즘"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.categoryId").isNumber())
                .andExpect(jsonPath("$.name").value("알고리즘"))
                .andExpect(jsonPath("$.snippetCount").value(0));
    }

    @Test
    void updateCategoryReturnsUpdatedCategory() throws Exception {
        String accessToken = signupAndLogin("category-update@example.com", "category-update-user");
        Long categoryId = createCategory(accessToken, "백엔드");

        mockMvc.perform(put("/api/categories/{categoryId}", categoryId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "서버"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(categoryId))
                .andExpect(jsonPath("$.name").value("서버"))
                .andExpect(jsonPath("$.snippetCount").value(0));
    }

    @Test
    void getCategoriesReturnsSnippetCountForEachCategory() throws Exception {
        String accessToken = signupAndLogin("category-count@example.com", "category-count-user");
        Long backendCategoryId = createCategory(accessToken, "백엔드");
        Long algorithmCategoryId = createCategory(accessToken, "알고리즘");

        createSnippet(accessToken, backendCategoryId, "backend-1", "content-1");
        createSnippet(accessToken, backendCategoryId, "backend-2", "content-2");
        createSnippet(accessToken, algorithmCategoryId, "algorithm-1", "content-3");

        mockMvc.perform(get("/api/categories")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].categoryId").value(backendCategoryId))
                .andExpect(jsonPath("$[0].snippetCount").value(2))
                .andExpect(jsonPath("$[1].categoryId").value(algorithmCategoryId))
                .andExpect(jsonPath("$[1].snippetCount").value(1));
    }

    @Test
    void deleteCategoryClearsCategoryFromOwnedSnippet() throws Exception {
        String accessToken = signupAndLogin("category-delete@example.com", "category-delete-user");
        Long categoryId = createCategory(accessToken, "트러블슈팅");
        Long snippetId = createSnippet(accessToken, categoryId, "에러 기록", "stacktrace");

        mockMvc.perform(delete("/api/categories/{categoryId}", categoryId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/snippets/{snippetId}", snippetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value(nullValue()));
    }

    @Test
    void createCategoryReturnsConflictWhenNameIsDuplicatedForSameMember() throws Exception {
        String accessToken = signupAndLogin("category-duplicate@example.com", "category-duplicate-user");
        createCategory(accessToken, "백엔드");

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "백엔드"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_CATEGORY_NAME"))
                .andExpect(jsonPath("$.message").value("이미 사용 중인 카테고리 이름입니다."));
    }

    private String signupAndLogin(String email, String nickname) throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "password123",
                                  "nickname": "%s"
                                }
                                """.formatted(email, nickname)))
                .andExpect(status().isCreated());

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "password123"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();

        return extractAccessToken(loginResult.getResponse().getContentAsString());
    }

    private Long createCategory(String accessToken, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "%s"
                                }
                                """.formatted(name)))
                .andExpect(status().isCreated())
                .andReturn();

        return extractLongValue(result.getResponse().getContentAsString(), "categoryId");
    }

    private Long createSnippet(String accessToken, Long categoryId, String title, String content) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/snippets")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "%s",
                                  "content": "%s",
                                  "language": "Java",
                                  "description": "test-description",
                                  "categoryId": %d,
                                  "tags": ["Java"]
                                }
                                """.formatted(title, content, categoryId)))
                .andExpect(status().isCreated())
                .andReturn();

        return extractLongValue(result.getResponse().getContentAsString(), "snippetId");
    }

    private String extractAccessToken(String responseBody) {
        String marker = "\"accessToken\":\"";
        int start = responseBody.indexOf(marker) + marker.length();
        int end = responseBody.indexOf('"', start);
        return responseBody.substring(start, end);
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
