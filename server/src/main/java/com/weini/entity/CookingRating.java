package com.weini.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cooking_ratings",
    uniqueConstraints = @UniqueConstraint(columnNames = {"cooking_record_id", "rater_id"}))
public class CookingRating {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "cooking_record_id", nullable = false)
  private CookingRecord cookingRecord;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "rater_id", nullable = false)
  private User rater;

  @Column(nullable = false)
  private int rating;

  @Column(length = 255)
  private String comment;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public CookingRating() {
  }

  @PrePersist
  void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() { return id; }
  public CookingRecord getCookingRecord() { return cookingRecord; }
  public User getRater() { return rater; }
  public int getRating() { return rating; }
  public String getComment() { return comment; }
  public LocalDateTime getCreatedAt() { return createdAt; }

  public void setCookingRecord(CookingRecord cookingRecord) { this.cookingRecord = cookingRecord; }
  public void setRater(User rater) { this.rater = rater; }
  public void setRating(int rating) { this.rating = rating; }
  public void setComment(String comment) { this.comment = comment; }
}
