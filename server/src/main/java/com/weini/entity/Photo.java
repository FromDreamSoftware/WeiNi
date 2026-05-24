package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "photos")
public class Photo {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "album_id", nullable = false)
  private PhotoAlbum album;

  @Column(name = "image_url", nullable = false, length = 255)
  private String imageUrl;

  @Column(length = 500)
  private String caption;

  @Column(length = 255)
  private String tags;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "uploaded_by", nullable = false)
  private User uploadedBy;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public Photo() {
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public PhotoAlbum getAlbum() { return album; }
  public String getImageUrl() { return imageUrl; }
  public String getCaption() { return caption; }
  public String getTags() { return tags; }
  public User getUploadedBy() { return uploadedBy; }
  public LocalDateTime getCreatedAt() { return createdAt; }

  public void setAlbum(PhotoAlbum album) { this.album = album; }
  public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
  public void setCaption(String caption) { this.caption = caption; }
  public void setTags(String tags) { this.tags = tags; }
  public void setUploadedBy(User uploadedBy) { this.uploadedBy = uploadedBy; }
}
