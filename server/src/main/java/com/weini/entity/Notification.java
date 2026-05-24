package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private NotificationType type;

  @Column(nullable = false, length = 100)
  private String title;

  @Column(nullable = false, length = 500)
  private String message;

  @Column(name = "related_entity_id")
  private Long relatedEntityId;

  @Column(name = "related_entity_type", length = 30)
  private String relatedEntityType;

  @Column(name = "is_read", nullable = false)
  private boolean isRead = false;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public Notification() {}

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public Long getUserId() { return userId; }
  public NotificationType getType() { return type; }
  public String getTitle() { return title; }
  public String getMessage() { return message; }
  public Long getRelatedEntityId() { return relatedEntityId; }
  public String getRelatedEntityType() { return relatedEntityType; }
  public boolean isRead() { return isRead; }
  public LocalDateTime getCreatedAt() { return createdAt; }

  public void setId(Long id) { this.id = id; }
  public void setUserId(Long userId) { this.userId = userId; }
  public void setType(NotificationType type) { this.type = type; }
  public void setTitle(String title) { this.title = title; }
  public void setMessage(String message) { this.message = message; }
  public void setRelatedEntityId(Long relatedEntityId) { this.relatedEntityId = relatedEntityId; }
  public void setRelatedEntityType(String relatedEntityType) { this.relatedEntityType = relatedEntityType; }
  public void setRead(boolean read) { isRead = read; }
}
