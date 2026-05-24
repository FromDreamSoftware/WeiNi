package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "meal_orders")
public class MealOrder {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "order_date", nullable = false)
  private LocalDate orderDate;

  @Enumerated(EnumType.STRING)
  @Column(name = "meal_type", nullable = false)
  private MealType mealType;

  @Column(name = "dish_name", nullable = false, length = 100)
  private String dishName;

  @Column(length = 255)
  private String notes;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private MealOrderStatus status = MealOrderStatus.PENDING;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "ordered_by", nullable = false)
  private User orderedBy;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "handler_id")
  private User handler;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "completed_at")
  private LocalDateTime completedAt;

  public MealOrder() {
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public LocalDate getOrderDate() { return orderDate; }
  public MealType getMealType() { return mealType; }
  public String getDishName() { return dishName; }
  public String getNotes() { return notes; }
  public MealOrderStatus getStatus() { return status; }
  public User getOrderedBy() { return orderedBy; }
  public User getHandler() { return handler; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public LocalDateTime getCompletedAt() { return completedAt; }

  public void setStatus(MealOrderStatus status) { this.status = status; }
  public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
  public void setOrderDate(LocalDate orderDate) { this.orderDate = orderDate; }
  public void setMealType(MealType mealType) { this.mealType = mealType; }
  public void setDishName(String dishName) { this.dishName = dishName; }
  public void setNotes(String notes) { this.notes = notes; }
  public void setOrderedBy(User orderedBy) { this.orderedBy = orderedBy; }
  public void setHandler(User handler) { this.handler = handler; }
}
