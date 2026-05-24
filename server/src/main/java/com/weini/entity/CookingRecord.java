package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cooking_records")
public class CookingRecord {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "meal_order_id")
  private MealOrder mealOrder;

  @Column(name = "cooking_date", nullable = false)
  private LocalDate cookingDate;

  @Column(name = "photo_url")
  private String photoUrl;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "chef_id", nullable = false)
  private User chef;

  @Column(length = 500)
  private String note;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public CookingRecord() {
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public MealOrder getMealOrder() { return mealOrder; }
  public LocalDate getCookingDate() { return cookingDate; }
  public String getPhotoUrl() { return photoUrl; }
  public User getChef() { return chef; }
  public String getNote() { return note; }
  public LocalDateTime getCreatedAt() { return createdAt; }

  public void setMealOrder(MealOrder mealOrder) { this.mealOrder = mealOrder; }
  public void setCookingDate(LocalDate cookingDate) { this.cookingDate = cookingDate; }
  public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
  public void setChef(User chef) { this.chef = chef; }
  public void setNote(String note) { this.note = note; }
}
