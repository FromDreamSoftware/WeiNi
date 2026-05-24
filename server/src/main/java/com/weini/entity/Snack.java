package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "snacks")
public class Snack {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(nullable = false, length = 50)
  private String category;

  @Column(name = "image_url")
  private String imageUrl;

  @Column(nullable = false)
  private int stock;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SnackStatus status;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public Snack() {
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public String getName() { return name; }
  public String getCategory() { return category; }
  public String getImageUrl() { return imageUrl; }
  public int getStock() { return stock; }
  public SnackStatus getStatus() { return status; }
  public LocalDateTime getCreatedAt() { return createdAt; }

  public void setId(Long id) { this.id = id; }
  public void setName(String name) { this.name = name; }
  public void setCategory(String category) { this.category = category; }
  public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
  public void setStock(int stock) { this.stock = stock; }
  public void setStatus(SnackStatus status) { this.status = status; }
}
