package com.gumasaje.algoreview.member.repository;

import com.gumasaje.algoreview.member.domain.Member;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {

    boolean existsByEmail(String email);

    Optional<Member> findByEmail(String email);

    boolean existsByNickname(String nickname);
}
