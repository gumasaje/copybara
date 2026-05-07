package com.gumasaje.copybara.member.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "members")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, unique = true, length = 50)
    private String nickname;

    @Column(length = 255)
    private String githubRepoUrl;

    @Column(length = 255)
    private String githubAccessToken;

    protected Member() {
    }

    public Member(String email, String password, String nickname, String githubRepoUrl, String githubAccessToken) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.githubRepoUrl = githubRepoUrl;
        this.githubAccessToken = githubAccessToken;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getNickname() {
        return nickname;
    }

    public String getGithubRepoUrl() {
        return githubRepoUrl;
    }

    public String getGithubAccessToken() {
        return githubAccessToken;
    }
}
