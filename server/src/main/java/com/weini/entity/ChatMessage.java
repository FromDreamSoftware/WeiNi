package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

  public enum Role {
    USER, AI
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private Role role;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String content;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  protected ChatMessage() {}

  public ChatMessage(User user, Role role, String content) {
    this.user = user;
    this.role = role;
    this.content = content;
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public User getUser() { return user; }
  public Role getRole() { return role; }
  public String getContent() { return content; }
  public LocalDateTime getCreatedAt() { return createdAt; }
}
