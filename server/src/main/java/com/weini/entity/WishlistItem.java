package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "wishlist")
public class WishlistItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 200)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "image_url")
  private String imageUrl;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private WishlistCategory category = WishlistCategory.OTHER;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private WishlistStatus status = WishlistStatus.PENDING;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "created_by", nullable = false)
  private User createdBy;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "achieved_by")
  private User achievedBy;

  @Column(name = "achieved_at")
  private LocalDateTime achievedAt;

  @Column(name = "achieved_photo")
  private String achievedPhoto;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public WishlistItem() {
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public String getTitle() { return title; }
  public String getDescription() { return description; }
  public String getImageUrl() { return imageUrl; }
  public WishlistCategory getCategory() { return category; }
  public WishlistStatus getStatus() { return status; }
  public User getCreatedBy() { return createdBy; }
  public User getAchievedBy() { return achievedBy; }
  public LocalDateTime getAchievedAt() { return achievedAt; }
  public String getAchievedPhoto() { return achievedPhoto; }
  public LocalDateTime getCreatedAt() { return createdAt; }

  public void setTitle(String title) { this.title = title; }
  public void setDescription(String description) { this.description = description; }
  public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
  public void setCategory(WishlistCategory category) { this.category = category; }
  public void setStatus(WishlistStatus status) { this.status = status; }
  public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
  public void setAchievedBy(User achievedBy) { this.achievedBy = achievedBy; }
  public void setAchievedAt(LocalDateTime achievedAt) { this.achievedAt = achievedAt; }
  public void setAchievedPhoto(String achievedPhoto) { this.achievedPhoto = achievedPhoto; }
}
