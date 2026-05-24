package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "snack_requests")
public class SnackRequest {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SnackRequestType type;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "snack_id")
  private Snack snack;

  @Column(name = "snack_name", length = 100)
  private String snackName;

  @Column(nullable = false)
  private int count = 1;

  @Column(name = "category_name", length = 50)
  private String categoryName;

  @Column(length = 255)
  private String reason;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SnackRequestStatus status = SnackRequestStatus.PENDING;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "requester_id", nullable = false)
  private User requester;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "handler_id")
  private User handler;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "resolved_at")
  private LocalDateTime resolvedAt;

  public SnackRequest() {
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public SnackRequestType getType() { return type; }
  public Snack getSnack() { return snack; }
  public String getSnackName() { return snackName; }
  public int getCount() { return count; }
  public String getCategoryName() { return categoryName; }
  public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
  public String getReason() { return reason; }
  public SnackRequestStatus getStatus() { return status; }
  public User getRequester() { return requester; }
  public User getHandler() { return handler; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public LocalDateTime getResolvedAt() { return resolvedAt; }

  public void setStatus(SnackRequestStatus status) { this.status = status; }
  public void setHandler(User handler) { this.handler = handler; }
  public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
  public void setSnackName(String snackName) { this.snackName = snackName; }
  public void setType(SnackRequestType type) { this.type = type; }
  public void setSnack(Snack snack) { this.snack = snack; }
  public void setCount(int count) { this.count = count; }
  public void setReason(String reason) { this.reason = reason; }
  public void setRequester(User requester) { this.requester = requester; }
}
