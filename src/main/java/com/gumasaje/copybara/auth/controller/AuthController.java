package com.gumasaje.copybara.auth.controller;

import com.gumasaje.copybara.auth.dto.LoginRequest;
import com.gumasaje.copybara.auth.dto.LoginResponse;
import com.gumasaje.copybara.auth.dto.MeResponse;
import com.gumasaje.copybara.auth.dto.SignupRequest;
import com.gumasaje.copybara.auth.dto.SignupResponse;
import com.gumasaje.copybara.auth.service.AuthMember;
import com.gumasaje.copybara.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public SignupResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal AuthMember authMember) {
        return authService.getMe(authMember.memberId());
    }
}
