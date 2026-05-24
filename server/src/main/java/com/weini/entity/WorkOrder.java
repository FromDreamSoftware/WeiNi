package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "work_orders")
public class WorkOrder {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 200)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private WorkOrderCategory category;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private WorkOrderPriority priority = WorkOrderPriority.MEDIUM;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private WorkOrderStatus status = WorkOrderStatus.SUBMITTED;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "creator_id", nullable = false)
  private User creator;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "handler_id")
  private User handler;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "resolved_at")
  private LocalDateTime resolvedAt;

  @Column(name = "handler_note", length = 500)
  private String handlerNote;

  public WorkOrder() {
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public String getTitle() { return title; }
  public String getDescription() { return description; }
  public WorkOrderCategory getCategory() { return category; }
  public WorkOrderPriority getPriority() { return priority; }
  public WorkOrderStatus getStatus() { return status; }
  public User getCreator() { return creator; }
  public User getHandler() { return handler; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public LocalDateTime getResolvedAt() { return resolvedAt; }
  public String getHandlerNote() { return handlerNote; }

  public void setId(Long id) { this.id = id; }
  public void setTitle(String title) { this.title = title; }
  public void setDescription(String description) { this.description = description; }
  public void setCategory(WorkOrderCategory category) { this.category = category; }
  public void setPriority(WorkOrderPriority priority) { this.priority = priority; }
  public void setStatus(WorkOrderStatus status) { this.status = status; }
  public void setCreator(User creator) { this.creator = creator; }
  public void setHandler(User handler) { this.handler = handler; }
  public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
  public void setHandlerNote(String handlerNote) { this.handlerNote = handlerNote; }
}
