package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "photo_comments")
public class PhotoComment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "photo_id", nullable = false)
  private Photo photo;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false, length = 500)
  private String content;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public PhotoComment() {
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public Photo getPhoto() { return photo; }
  public User getUser() { return user; }
  public String getContent() { return content; }
  public LocalDateTime getCreatedAt() { return createdAt; }

  public void setPhoto(Photo photo) { this.photo = photo; }
  public void setUser(User user) { this.user = user; }
  public void setContent(String content) { this.content = content; }
}
