package com.gumasaje.copybara.auth.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class JwtServiceTest {

    @Autowired
    private JwtService jwtService;

    @Test
    void createAccessTokenAndExtractClaims() {
        String token = jwtService.createAccessToken(1L, "tester@example.com");

        assertThat(jwtService.extractMemberId(token)).isEqualTo(1L);
        assertThat(jwtService.extractEmail(token)).isEqualTo("tester@example.com");
        assertThat(jwtService.isExpired(token)).isFalse();
    }
}
