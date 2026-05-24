package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "anniversaries")
public class Anniversary {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 100)
  private String title;

  @Column(name = "event_date", nullable = false)
  private LocalDate eventDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AnniversaryType type;

  @Column(length = 50)
  private String icon;

  @Column(name = "custom_type", length = 50)
  private String customType;

  @Column(name = "image_url", length = 500)
  private String imageUrl;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  protected Anniversary() {
  }

  public Anniversary(String title, LocalDate eventDate, AnniversaryType type,
                     String icon, String customType, String imageUrl) {
    this.title = title;
    this.eventDate = eventDate;
    this.type = type;
    this.icon = icon;
    this.customType = customType;
    this.imageUrl = imageUrl;
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public String getTitle() { return title; }
  public LocalDate getEventDate() { return eventDate; }
  public AnniversaryType getType() { return type; }
  public String getIcon() { return icon; }
  public String getCustomType() { return customType; }
  public String getImageUrl() { return imageUrl; }
  public LocalDateTime getCreatedAt() { return createdAt; }
}
