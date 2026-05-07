package com.gumasaje.copybara.auth.service;

import com.gumasaje.copybara.auth.dto.LoginRequest;
import com.gumasaje.copybara.auth.dto.LoginResponse;
import com.gumasaje.copybara.auth.dto.MeResponse;
import com.gumasaje.copybara.auth.dto.SignupRequest;
import com.gumasaje.copybara.auth.dto.SignupResponse;
import com.gumasaje.copybara.common.exception.DuplicateEmailException;
import com.gumasaje.copybara.common.exception.DuplicateNicknameException;
import com.gumasaje.copybara.common.exception.InvalidLoginException;
import com.gumasaje.copybara.member.domain.Member;
import com.gumasaje.copybara.member.repository.MemberRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(MemberRepository memberRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.memberRepository = memberRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public SignupResponse signup(SignupRequest request) {
        validateDuplicateEmail(request.email());
        validateDuplicateNickname(request.nickname());

        Member member = new Member(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.nickname()
        );

        Member savedMember = memberRepository.save(member);

        return new SignupResponse(
                savedMember.getId(),
                savedMember.getEmail(),
                savedMember.getNickname()
        );
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Member member = memberRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidLoginException("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.password(), member.getPassword())) {
            throw new InvalidLoginException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        String accessToken = jwtService.createAccessToken(member.getId(), member.getEmail());

        return new LoginResponse(
                member.getId(),
                member.getEmail(),
                member.getNickname(),
                accessToken
        );
    }

    @Transactional(readOnly = true)
    public MeResponse getMe(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new InvalidLoginException("인증된 회원 정보를 찾을 수 없습니다."));

        return new MeResponse(
                member.getId(),
                member.getEmail(),
                member.getNickname()
        );
    }

    private void validateDuplicateEmail(String email) {
        if (memberRepository.existsByEmail(email)) {
            throw new DuplicateEmailException("이미 사용 중인 이메일입니다.");
        }
    }

    private void validateDuplicateNickname(String nickname) {
        if (memberRepository.existsByNickname(nickname)) {
            throw new DuplicateNicknameException("이미 사용 중인 닉네임입니다.");
        }
    }
}
