package com.gumasaje.copybara.auth.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.gumasaje.copybara.member.repository.MemberRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MemberRepository memberRepository;

    @Test
    void signupCreatesMember() throws Exception {
        String requestBody = """
                {
                  "email": "tester@example.com",
                  "password": "password123",
                  "nickname": "tester"
                }
                """;

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.memberId").isNumber())
                .andExpect(jsonPath("$.email").value("tester@example.com"))
                .andExpect(jsonPath("$.nickname").value("tester"));
    }

    @Test
    void signupReturnsConflictWhenEmailIsDuplicated() throws Exception {
        String requestBody = """
                {
                  "email": "duplicate@example.com",
                  "password": "password123",
                  "nickname": "tester1"
                }
                """;

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated());

        String duplicateRequestBody = """
                {
                  "email": "duplicate@example.com",
                  "password": "password123",
                  "nickname": "tester2"
                }
                """;

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(duplicateRequestBody))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_EMAIL"))
                .andExpect(jsonPath("$.message").value("이미 사용 중인 이메일입니다."));
    }

    @Test
    void loginReturnsAccessTokenWhenCredentialsAreValid() throws Exception {
        String signupRequestBody = """
                {
                  "email": "login-success@example.com",
                  "password": "password123",
                  "nickname": "login-user"
                }
                """;

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupRequestBody))
                .andExpect(status().isCreated());

        String loginRequestBody = """
                {
                  "email": "login-success@example.com",
                  "password": "password123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginRequestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberId").isNumber())
                .andExpect(jsonPath("$.email").value("login-success@example.com"))
                .andExpect(jsonPath("$.nickname").value("login-user"))
                .andExpect(jsonPath("$.accessToken").isString());
    }

    @Test
    void loginReturnsUnauthorizedWhenPasswordIsInvalid() throws Exception {
        String signupRequestBody = """
                {
                  "email": "login-fail@example.com",
                  "password": "password123",
                  "nickname": "login-fail-user"
                }
                """;

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupRequestBody))
                .andExpect(status().isCreated());

        String loginRequestBody = """
                {
                  "email": "login-fail@example.com",
                  "password": "wrong-password"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginRequestBody))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_LOGIN"))
                .andExpect(jsonPath("$.message").value("이메일 또는 비밀번호가 올바르지 않습니다."));
    }

    @Test
    void meReturnsUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    void meReturnsAuthenticatedMemberWhenTokenIsValid() throws Exception {
        String signupRequestBody = """
                {
                  "email": "me@example.com",
                  "password": "password123",
                  "nickname": "me-user"
                }
                """;

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupRequestBody))
                .andExpect(status().isCreated());

        String loginRequestBody = """
                {
                  "email": "me@example.com",
                  "password": "password123"
                }
                """;

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginRequestBody))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        String accessToken = extractAccessToken(responseBody);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberId").isNumber())
                .andExpect(jsonPath("$.email").value("me@example.com"))
                .andExpect(jsonPath("$.nickname").value("me-user"));
    }

    private String extractAccessToken(String responseBody) {
        String marker = "\"accessToken\":\"";
        int start = responseBody.indexOf(marker) + marker.length();
        int end = responseBody.indexOf('"', start);
        return responseBody.substring(start, end);
    }
}
