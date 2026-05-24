package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "photo_albums")
public class PhotoAlbum {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 200)
  private String title;

  @Column(name = "cover_image_url")
  private String coverImageUrl;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public PhotoAlbum() {
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public String getTitle() { return title; }
  public String getCoverImageUrl() { return coverImageUrl; }
  public LocalDateTime getCreatedAt() { return createdAt; }

  public void setTitle(String title) { this.title = title; }
  public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }
}
