package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 50)
  private String username;

  @Column(name = "password_hash", nullable = false, length = 255)
  private String passwordHash;

  @Column(nullable = false, length = 50)
  private String nickname;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role;

  @Column(name = "avatar_url")
  private String avatarUrl;

  @Column(length = 100)
  private String email;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  protected User() {
  }

  public User(String username, String passwordHash, String nickname, Role role) {
    this.username = username;
    this.passwordHash = passwordHash;
    this.nickname = nickname;
    this.role = role;
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public String getUsername() { return username; }
  public String getPasswordHash() { return passwordHash; }
  public String getNickname() { return nickname; }
  public Role getRole() { return role; }
  public String getAvatarUrl() { return avatarUrl; }
  public String getEmail() { return email; }
  public void setNickname(String nickname) { this.nickname = nickname; }
  public void setEmail(String email) { this.email = email; }
  public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
  public LocalDateTime getCreatedAt() { return createdAt; }
}
