package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "meal_menu")
public class MenuItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "dish_name", nullable = false, length = 100)
  private String dishName;

  @Column(length = 50)
  private String category;

  @Column(name = "image_url")
  private String imageUrl;

  @Column(name = "is_active")
  private boolean isActive = true;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public MenuItem() {
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public String getDishName() { return dishName; }
  public String getCategory() { return category; }
  public String getImageUrl() { return imageUrl; }
  public boolean isActive() { return isActive; }
  public LocalDateTime getCreatedAt() { return createdAt; }

  public void setDishName(String dishName) { this.dishName = dishName; }
  public void setCategory(String category) { this.category = category; }
  public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
  public void setActive(boolean active) { isActive = active; }
}
